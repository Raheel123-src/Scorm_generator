const SCORMPackage = require('../models/SCORMPackage');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');
const FormData = require('form-data');
const videoService = require('../services/videoService');
const documentService = require('../services/documentService');
const pdfExtraction = require('pdf-extraction');
const mammoth = require('mammoth');
const multer = require('multer');
const os = require('os');

// Configure multer for file uploads
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOC/DOCX files are allowed.'));
    }
  }
});

// Function to fetch text content from S3 URL
async function fetchTextContent(s3Url) {
  try {
    console.log(`📄 Fetching text content from: ${s3Url}`);
    const response = await axios.get(s3Url, {
      timeout: 10000,
      headers: {
        'Accept': 'text/plain, text/*, */*'
      }
    });
    
    const content = response.data;
    console.log(`✅ Text content fetched successfully, length: ${content.length} characters`);
    return content;
  } catch (error) {
    console.error('❌ Error fetching text content:', error.message);
    return null;
  }
}

// Get all SCORM packages for the authenticated user
const getAllSCORMs = async (req, res) => {
  try {
    // Fetch all fields including content to match exactly what frontend sent
    const packages = await SCORMPackage.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 });

    res.json({
      packages: packages.map(pkg => ({
        id: pkg._id,
        title: pkg.title,
        description: pkg.description,
        userId: pkg.userId.toString(),
        content: pkg.content, // Return full content array exactly as stored (from frontend format)
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
        isPublished: pkg.isPublished,
        contentBlocks: pkg.content.length // Keep for backwards compatibility
      }))
    });
  } catch (error) {
    console.error('Get SCORM packages error:', error);
    res.status(500).json({ message: 'Server error while fetching SCORM packages' });
  }
};

// Get a specific SCORM package
const getSCORM = async (req, res) => {
  try {
    const packageId = req.params.id;
    const scormPackage = await SCORMPackage.findOne({ 
      _id: packageId, 
      userId: req.user.userId 
    });

    if (!scormPackage) {
      return res.status(404).json({ message: 'SCORM package not found' });
    }

    res.json({
      id: scormPackage._id,
      title: scormPackage.title,
      description: scormPackage.description,
      userId: scormPackage.userId.toString(),
      content: scormPackage.content, // Return content exactly as stored (from frontend format)
      isPublished: scormPackage.isPublished,
      createdAt: scormPackage.createdAt,
      updatedAt: scormPackage.updatedAt
    });
  } catch (error) {
    console.error('Get SCORM package error:', error);
    res.status(500).json({ message: 'Server error while fetching SCORM package' });
  }
};

// Create a new SCORM package
const createSCORM = async (req, res) => {
  try {
    const { title, description, content = [] } = req.body;

    console.log('Creating SCORM package:', { title, contentLength: content.length, userId: req.user.userId });

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    // Store content exactly as received from frontend to preserve format
    // This ensures the frontend can load it back into the editor template correctly
    const scormPackage = new SCORMPackage({
      title,
      description,
      userId: req.user.userId,
      content: content // Store content exactly as received
    });

    await scormPackage.save();

    console.log('SCORM package created successfully:', scormPackage._id);

    res.status(201).json({
      message: 'SCORM package created successfully',
      id: scormPackage._id,
      title: scormPackage.title,
      description: scormPackage.description,
      userId: scormPackage.userId.toString(),
      content: scormPackage.content, // Return content exactly as stored (from frontend format)
      createdAt: scormPackage.createdAt,
      updatedAt: scormPackage.updatedAt
    });
  } catch (error) {
    console.error('Create SCORM package error:', error);
    res.status(500).json({ 
      message: 'Server error while creating SCORM package',
      error: error.message 
    });
  }
};

// Update a SCORM package
const updateSCORM = async (req, res) => {
  try {
    const packageId = req.params.id;
    const { title, description, content } = req.body;

    // Store content exactly as received from frontend to preserve format
    const scormPackage = await SCORMPackage.findOneAndUpdate(
      { _id: packageId, userId: req.user.userId },
      { 
        title, 
        description, 
        content: content, // Store content exactly as received from frontend
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!scormPackage) {
      return res.status(404).json({ message: 'SCORM package not found' });
    }

    res.json({
      message: 'SCORM package updated successfully',
      id: scormPackage._id,
      title: scormPackage.title,
      description: scormPackage.description,
      userId: scormPackage.userId.toString(),
      content: scormPackage.content, // Return content exactly as stored (from frontend format)
      createdAt: scormPackage.createdAt,
      updatedAt: scormPackage.updatedAt
    });
  } catch (error) {
    console.error('Update SCORM package error:', error);
    res.status(500).json({ message: 'Server error while updating SCORM package' });
  }
};

// Delete a SCORM package
const deleteSCORM = async (req, res) => {
  try {
    const packageId = req.params.id;
    const scormPackage = await SCORMPackage.findOneAndDelete({ 
      _id: packageId, 
      userId: req.user.userId 
    });

    if (!scormPackage) {
      return res.status(404).json({ message: 'SCORM package not found' });
    }

    res.json({ message: 'SCORM package deleted successfully' });
  } catch (error) {
    console.error('Delete SCORM package error:', error);
    res.status(500).json({ message: 'Server error while deleting SCORM package' });
  }
};

// Publish a SCORM package
const publishSCORM = async (req, res) => {
  try {
    const packageId = req.params.id;
    const scormPackage = await SCORMPackage.findOneAndUpdate(
      { _id: packageId, userId: req.user.userId },
      { 
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!scormPackage) {
      return res.status(404).json({ message: 'SCORM package not found' });
    }

    res.json({
      message: 'SCORM package published successfully',
      isPublished: scormPackage.isPublished,
      publishedAt: scormPackage.publishedAt
    });
  } catch (error) {
    console.error('Publish SCORM package error:', error);
    res.status(500).json({ message: 'Server error while publishing SCORM package' });
  }
};

// Generate slide script from prompt using GPT-4o-mini
async function generateSlideScript(basePrompt, slideIndex, totalSlides, previousContent = '') {
  try {
    console.log(`🤖 Generating slide script with GPT-4o-mini for slide ${slideIndex + 1}...`);

    const chatResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a script writer for educational audio content. Create engaging, conversational scripts that are clear, friendly, and educational.'
        },
        {
          role: 'user',
          content: basePrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const script = chatResponse.data.choices[0]?.message?.content?.trim();
    
    if (!script) {
      console.warn('GPT-4o-mini did not return a script');
      return null;
    }

    console.log(`✅ Slide script generated successfully for slide ${slideIndex + 1}`);
    return script;
  } catch (error) {
    console.error('Script generation error:', error.response?.data || error.message);
    return null;
  }
}

// Generate TTS audio for slide content
async function generateTTSAudio(content, slideIndex, totalSlides, previousContent = '') {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      console.warn('OpenAI API key not configured. Skipping TTS generation.');
      return null;
    }

    // Step 1: Create base prompt from content
    const basePrompt = `You are a warm, enthusiastic AI voice assistant creating engaging audio summaries for educational content. Your goal is to make learning feel personal, friendly, and exciting!

Previous slide context: ${previousContent}

Current slide content: ${content}

Create a friendly, conversational audio summary (2-3 minutes max) that:
1. Greets the learner warmly or continues context connecting to previous content naturally
2. Explains the current slide content in an engaging, easy-to-understand way
3. Uses encouraging language like "Let's explore together" or "You're doing great!"
4. Maintains a positive, supportive educational flow
5. Highlights key points with enthusiasm and makes learning objectives feel achievable
6. Uses conversational phrases like "Now, here's something interesting..." or "This is really important because..."
7. Ends with encouragement for the next step

Make it feel like a friendly tutor is personally guiding the learner through their educational journey. Be warm, encouraging, and make the content come alive!`;

    // Step 2: Generate slide script using GPT-4o-mini
    const slideScript = await generateSlideScript(basePrompt, slideIndex, totalSlides, previousContent);
    
    if (!slideScript) {
      console.warn(`Failed to generate script for slide ${slideIndex + 1}. Using base prompt as fallback.`);
      // Fallback: use base prompt directly if script generation fails
      const fallbackScript = basePrompt;
      
      console.log(`🔊 Generating TTS audio for slide ${slideIndex + 1} (using fallback prompt)...`);

    const response = await axios.post('https://api.openai.com/v1/audio/speech', {
      model: 'tts-1',
        input: fallbackScript,
      voice: 'nova', // Available voices: alloy, echo, fable, onyx, nova, shimmer
      response_format: 'mp3'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

      console.log(`✅ TTS audio generated successfully for slide ${slideIndex + 1} (fallback)`);
      return response.data;
    }

    // Step 3: Generate audio from the script using TTS
    console.log(`🔊 Generating TTS audio for slide ${slideIndex + 1} from script...`);

    const response = await axios.post('https://api.openai.com/v1/audio/speech', {
      model: 'tts-1',
      input: slideScript,
      voice: 'nova', // Available voices: alloy, echo, fable, onyx, nova, shimmer
      response_format: 'mp3'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

    console.log(`✅ TTS audio generated successfully for slide ${slideIndex + 1}`);
    return response.data;
  } catch (error) {
    console.error('TTS generation error:', error.response?.data || error.message);
    return null;
  }
}

// Generate SCORM package with TTS audio
const generateSCORM = async (req, res) => {
  try {
    const packageId = req.params.id;
    const { includeTTS = false, videoData = {}, documentData = {} } = req.body;
    
    console.log(`\n🎬 SCORM GENERATION REQUEST`);
    console.log(`   - Package ID: ${packageId}`);
    console.log(`   - Include TTS: ${includeTTS}`);
    console.log(`   - Video Data received: ${Object.keys(videoData).length} videos`);
    console.log(`   - Document Data received: ${Object.keys(documentData).length} documents`);
    console.log(`   - Video Data keys:`, Object.keys(videoData));
    console.log(`   - Document Data keys:`, Object.keys(documentData));
    console.log(`   - Video Data values:`, Object.values(videoData).map(v => v ? v.substring(0, 50) + '...' : 'null'));
    console.log(`   - Document Data values:`, Object.values(documentData).map(d => d ? d.substring(0, 50) + '...' : 'null'));

    const scormPackage = await SCORMPackage.findOne({ 
      _id: packageId, 
      userId: req.user.userId 
    });

    if (!scormPackage) {
      return res.status(404).json({ message: 'SCORM package not found' });
    }

    // Create temporary directory for SCORM package
    const tempDir = path.join(__dirname, '..', 'temp', `scorm_${packageId}_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Create assets directory for video files
    const assetsDir = path.join(tempDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    // Generate SCORM manifest
    const manifest = generateSCORMManifest(scormPackage);
    fs.writeFileSync(path.join(tempDir, 'imsmanifest.xml'), manifest);

    // Generate HTML files for each content block
    const audioFiles = [];
    const videoFiles = [];
    let previousContent = '';

    // Create a copy of content to process videos
    const processedContent = JSON.parse(JSON.stringify(scormPackage.content));

    for (let i = 0; i < processedContent.length; i++) {
      const block = processedContent[i];
      
      // Process video files for LMS compatibility
      console.log(`\n=== PROCESSING BLOCK ${i + 1} ===`);
      console.log(`Block type: ${block.type}`);
      console.log(`Block ID: ${block.id}`);
      console.log(`Has video data: ${block.data.hasVideoData}`);
      console.log(`Current videoUrl: ${block.data.videoUrl}`);
      
      // Process document files for LMS compatibility
      if (block.type === 'document' && (block.data.hasDocumentData || (block.data.documentUrl && (block.data.documentUrl.startsWith('data:') || block.data.documentUrl.startsWith('blob:'))))) {
        // Use the original document data from the request, or from block data
        const originalDocumentUrl = documentData[block.id] || block.data.documentUrl;
        console.log(`📄 Document data for block ${block.id}: ${originalDocumentUrl ? 'EXISTS' : 'NOT FOUND'}`);
        console.log(`📄 Document URL type: ${originalDocumentUrl ? (originalDocumentUrl.startsWith('data:') ? 'data' : originalDocumentUrl.startsWith('blob:') ? 'blob' : 'other') : 'none'}`);
        
        if (originalDocumentUrl && originalDocumentUrl.startsWith('data:')) {
          try {
            console.log(`📄 Processing document for block ${block.id}`);
            
            // Get DOCX content if available
            const docxContent = block.data.docxContent || null;
            
            // Process and upload document to S3 with enhanced support
            const documentInfo = await documentService.processAndUploadDocument(
              originalDocumentUrl, 
              block.id, 
              block.data.fileType,
              docxContent
            );
            
            // Update the block data to reference the S3 URL
            block.data.documentUrl = documentInfo.s3Url;
            block.data.fileName = documentInfo.fileName;
            block.data.fileSize = documentInfo.fileSize;
            
            // Store DOCX content if available
            if (documentInfo.docxContent) {
              block.data.docxContent = documentInfo.docxContent;
              block.data.hasParsedContent = true;
            }
            
            console.log(`✅ Document uploaded to S3: ${documentInfo.s3Url}`);
            console.log(`✅ Document processing info:`, documentInfo);
          } catch (error) {
            console.error(`❌ Failed to process document for block ${block.id}:`, error);
            // Fallback to placeholder
            block.data.documentUrl = 'assets/document_placeholder.pdf';
          }
        } else if (originalDocumentUrl && originalDocumentUrl.startsWith('blob:')) {
          console.log(`⚠️  Blob URL detected for document - cannot process server-side`);
          // Fallback to placeholder
          block.data.documentUrl = 'assets/document_placeholder.pdf';
        }
      }
      
      if (block.type === 'video' && (block.data.hasVideoData || (block.data.videoUrl && (block.data.videoUrl.startsWith('data:') || block.data.videoUrl.startsWith('blob:'))))) {
        // Use the original video data from the request, or from block data
        const originalVideoUrl = videoData[block.id] || block.data.videoUrl;
        console.log(`Original video URL from request: ${originalVideoUrl ? 'EXISTS' : 'NOT FOUND'}`);
        console.log(`Original video URL starts with data: ${originalVideoUrl ? originalVideoUrl.startsWith('data:') : false}`);
        
        if (originalVideoUrl && originalVideoUrl.startsWith('data:')) {
          try {
            console.log(`🚀 STARTING video processing for block ${block.id}`);
            // Process and upload video to S3
            const s3Url = await videoService.processAndUploadVideo(originalVideoUrl, block.id);
            
            console.log(`✅ S3 URL RECEIVED: ${s3Url}`);
            
            // Update the block data to reference the S3 URL
            block.data.videoUrl = s3Url;
            videoFiles.push(s3Url);
            
            console.log(`✅ BLOCK DATA UPDATED:`);
            console.log(`   - videoUrl: ${block.data.videoUrl}`);
            console.log(`   - Full block data:`, JSON.stringify(block.data, null, 2));
          } catch (error) {
            console.error(`❌ FAILED to process video for block ${block.id}:`, error);
            // Fallback to placeholder
            block.data.videoUrl = 'assets/video_placeholder.mp4';
            console.log(`   - Fallback videoUrl: ${block.data.videoUrl}`);
          }
        } else {
          console.log(`⚠️  No valid video data found for block ${block.id}`);
        }
      } else if (block.type === 'video' && block.data.videoUrl && !block.data.videoUrl.includes('[PROCESSED_DURING_GENERATION]')) {
        // Handle external URLs - keep as is
        console.log(`🌐 Using external video URL: ${block.data.videoUrl}`);
      } else {
        console.log(`ℹ️  No video processing needed for this block`);
      }
      
      // Generate HTML content AFTER video processing is complete
      console.log(`\n📝 GENERATING HTML for slide ${i + 1}`);
      console.log(`   - Block videoUrl: ${block.data.videoUrl}`);
      console.log(`   - Block documentUrl: ${block.data.documentUrl}`);
      console.log(`   - Block type: ${block.type}`);
      console.log(`   - Block data:`, JSON.stringify(block.data, null, 2));
      
      const htmlContent = await generateSlideHTML(block, i, processedContent.length, includeTTS);
      
      // Log the generated HTML to see what video URL is being used
      if (block.type === 'video') {
        console.log(`🔍 CHECKING GENERATED HTML for video URL:`);
        const videoMatch = htmlContent.match(/<source src="([^"]+)"/);
        if (videoMatch) {
          console.log(`   - Found video source in HTML: ${videoMatch[1]}`);
        } else {
          console.log(`   - ❌ NO VIDEO SOURCE FOUND IN HTML!`);
        }
      }
      
      // Log the generated HTML to see what document URL is being used
      if (block.type === 'document') {
        console.log(`🔍 CHECKING GENERATED HTML for document URL:`);
        // Check for both iframe and download link patterns
        const iframeMatch = htmlContent.match(/<iframe[^>]+src="([^"]+)"/);
        const downloadMatch = htmlContent.match(/<a[^>]+href="([^"]+)"[^>]*class="[^"]*download[^"]*"/);
        const pdfControlMatch = htmlContent.match(/<a[^>]+href="([^"]+)"[^>]*class="[^"]*pdf-control[^"]*"/);
        
        if (iframeMatch) {
          console.log(`   - Found iframe document source: ${iframeMatch[1]}`);
        } else if (downloadMatch) {
          console.log(`   - Found download link source: ${downloadMatch[1]}`);
        } else if (pdfControlMatch) {
          console.log(`   - Found PDF control link source: ${pdfControlMatch[1]}`);
        } else {
          console.log(`   - ❌ NO DOCUMENT SOURCE FOUND IN HTML!`);
          console.log(`   - HTML snippet:`, htmlContent.substring(0, 500) + '...');
        }
      }
      
      const slideFile = `slide_${i + 1}.html`;
      fs.writeFileSync(path.join(tempDir, slideFile), htmlContent);
      console.log(`✅ HTML written to: ${slideFile}`);

      // Generate TTS audio if requested
      if (includeTTS) {
        const slideContent = extractSlideContent(block);
        const audioData = await generateTTSAudio(slideContent, i, processedContent.length, previousContent);
        
        if (audioData) {
          const audioFile = `audio_${i + 1}.mp3`;
          fs.writeFileSync(path.join(tempDir, audioFile), audioData);
          audioFiles.push(audioFile);
          console.log(`Audio file created: ${audioFile}`);
        } else {
          console.warn(`TTS audio generation failed for slide ${i + 1}. Continuing without audio.`);
        }
        
        previousContent = slideContent;
      }
    }

    // Generate main entry point - use first slide as entry point
    // Use the processed content (with updated video URLs) for the first slide
    const firstSlideHTML = await generateSlideHTML(processedContent[0], 0, processedContent.length, includeTTS);
    fs.writeFileSync(path.join(tempDir, 'index.html'), firstSlideHTML);

    // Generate SCORM API JavaScript
    const scormAPI = generateSCORMAPI();
    fs.writeFileSync(path.join(tempDir, 'scorm_api.js'), scormAPI);

    // Copy CSS styles
    const cssPath = path.join(__dirname, '..', 'styles', 'scorm-styles.css');
    if (fs.existsSync(cssPath)) {
      fs.copyFileSync(cssPath, path.join(tempDir, 'styles.css'));
    }

    // Create ZIP package - create in parent directory to avoid including ZIP in itself
    const zipPath = path.join(tempDir, '..', `scorm_package_${packageId}_${Date.now()}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error creating ZIP archive' });
      }
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Error cleaning up tempDir:', err);
      }
      try {
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }
      } catch (err) {
        console.error('Error cleaning up zipPath:', err);
      }
    });

    archive.pipe(output);
    
    // Add files individually to exclude the ZIP file itself
    archive.file(path.join(tempDir, 'imsmanifest.xml'), { name: 'imsmanifest.xml' });
    archive.file(path.join(tempDir, 'index.html'), { name: 'index.html' });
    archive.file(path.join(tempDir, 'scorm_api.js'), { name: 'scorm_api.js' });
    
    // Add CSS if it exists
    if (fs.existsSync(path.join(tempDir, 'styles.css'))) {
      archive.file(path.join(tempDir, 'styles.css'), { name: 'styles.css' });
    }
    
    // Add all HTML slide files
    for (let i = 0; i < processedContent.length; i++) {
      const slideFile = path.join(tempDir, `slide_${i + 1}.html`);
      if (fs.existsSync(slideFile)) {
        archive.file(slideFile, { name: `slide_${i + 1}.html` });
      }
    }
    
    // Add audio files if they exist
    if (includeTTS) {
      for (let i = 0; i < processedContent.length; i++) {
        const audioFile = path.join(tempDir, `audio_${i + 1}.mp3`);
        if (fs.existsSync(audioFile)) {
          const audioStats = fs.statSync(audioFile);
          console.log(`Adding audio file audio_${i + 1}.mp3: ${(audioStats.size / 1024 / 1024).toFixed(2)} MB`);
          archive.file(audioFile, { name: `audio_${i + 1}.mp3` });
        }
      }
    }
    
    // Add assets directory (videos, images, documents) if it exists
    if (fs.existsSync(assetsDir)) {
      const assetsFiles = fs.readdirSync(assetsDir, { recursive: true });
      console.log(`Adding ${assetsFiles.length} asset files`);
      for (const assetFile of assetsFiles) {
        const fullPath = path.join(assetsDir, assetFile);
        if (fs.statSync(fullPath).isFile()) {
          const assetStats = fs.statSync(fullPath);
          console.log(`  - assets/${assetFile}: ${(assetStats.size / 1024 / 1024).toFixed(2)} MB`);
          archive.file(fullPath, { name: `assets/${assetFile}` });
        }
      }
    }
    
    // Wait for archive to finalize
    await new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`Archive finalized, total bytes: ${archive.pointer()}`);
        resolve();
      });
      archive.on('error', reject);
      archive.finalize();
    });

    // Log generation summary
    console.log(`SCORM package generated successfully:`);
    console.log(`- Title: ${scormPackage.title}`);
    console.log(`- Slides: ${scormPackage.content.length}`);
    console.log(`- TTS Audio: ${includeTTS ? (audioFiles.length > 0 ? `${audioFiles.length} files` : 'Failed to generate') : 'Disabled'}`);
    
    const zipStats = fs.statSync(zipPath);
    console.log(`- Package size: ${(zipStats.size / 1024 / 1024).toFixed(2)} MB (${zipStats.size} bytes)`);

    // Send the ZIP file
    if (res.headersSent) {
      console.error('Response headers already sent, cannot send ZIP file');
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Error cleaning up tempDir:', err);
      }
      return;
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${scormPackage.title.replace(/[^a-zA-Z0-9]/g, '_')}.zip"`);
    
    const zipStream = fs.createReadStream(zipPath);
    
    // Handle stream errors
    zipStream.on('error', (err) => {
      console.error('Zip stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error reading ZIP file' });
      }
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Error cleaning up tempDir:', err);
      }
    });

    // Handle response close/errors
    res.on('close', () => {
      if (!res.writableEnded) {
        console.log('Response closed before completion');
        zipStream.destroy();
      }
      // Cleanup after response
      setTimeout(() => {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          console.error('Error cleaning up tempDir:', err);
        }
        try {
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
          }
        } catch (err) {
          console.error('Error cleaning up zipPath:', err);
        }
      }, 1000);
    });

    // Pipe ZIP to response
    zipStream.pipe(res);

    // Cleanup after sending
    zipStream.on('end', () => {
      console.log('ZIP file sent successfully');
      // Delay cleanup to ensure file is fully sent
      setTimeout(() => {
        try {
      fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          console.error('Error cleaning up tempDir:', err);
        }
        try {
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
          }
        } catch (err) {
          console.error('Error cleaning up zipPath:', err);
        }
      }, 1000);
    });

  } catch (error) {
    console.error('Generate SCORM package error:', error);
    res.status(500).json({ message: 'Server error while generating SCORM package' });
  }
};

// Helper function to generate SCORM manifest
function generateSCORMManifest(scormPackage) {
  const manifestId = `scorm_${scormPackage._id}`;
  const organizationId = `org_${scormPackage._id}`;
  
  let resources = '';
  let organizations = '';
  
  scormPackage.content.forEach((block, index) => {
    const resourceId = `resource_${index + 1}`;
    const itemId = `item_${index + 1}`;
    
    resources += `
    <resource identifier="${resourceId}" type="webcontent" adlcp:scormtype="sco" href="slide_${index + 1}.html">
      <file href="slide_${index + 1}.html"/>
    </resource>`;
    
    organizations += `
    <item identifier="${itemId}" identifierref="${resourceId}">
      <title>${block.title}</title>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${manifestId}" version="1.0" 
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" 
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd 
                              http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd 
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 3rd Edition</schemaversion>
  </metadata>
  <organizations default="${organizationId}">
    <organization identifier="${organizationId}">
      <title>${scormPackage.title}</title>
      <item identifier="item_main" identifierref="resource_main">
        <title>${scormPackage.content[0]?.title || 'Course Start'}</title>
      </item>
      ${organizations}
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_main" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm_api.js"/>
    </resource>
    ${resources}
  </resources>
</manifest>`;
}

// Helper function to generate slide HTML
async function generateSlideHTML(block, index, totalSlides, includeTTS) {
  const slideContent = await generateSlideContent(block);
  const audioElement = includeTTS ? `
    <audio id="slideAudio" preload="auto" style="display: none;">
      <source src="audio_${index + 1}.mp3" type="audio/mpeg">
    </audio>
    <div id="audioProgress" style="display: none; position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px;">
      <div>Playing audio...</div>
      <div id="progressBar" style="width: 100%; height: 4px; background: #333; margin-top: 5px;">
        <div id="progressFill" style="width: 0%; height: 100%; background: #4CAF50; transition: width 0.1s;"></div>
      </div>
    </div>
  ` : '';


  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${block.title}</title>
    <script src="scorm_api.js"></script>
    <link rel="stylesheet" href="styles.css">
    <style>
        body { 
            font-family: "Poppins", sans-serif;
            margin: 0; 
            padding: 20px; 
            background: #f8fafc;
            line-height: 1.6;
        }
        .navigation {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            display: flex;
            gap: 15px;
            z-index: 1000;
        }
        .nav-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .nav-btn:hover:not(:disabled) {
            background: #2563eb;
            transform: translateY(-2px);
        }
        .nav-btn:disabled {
            background: #6b7280;
            cursor: not-allowed;
            opacity: 0.6;
        }
        .nav-btn:disabled:hover {
            background: #6b7280;
            transform: none;
        }
        .completion-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        .completion-message {
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            max-width: 400px;
        }
        ${getSlideSpecificStyles(block.type)}
    </style>
</head>
<body>
    ${slideContent}
    
    ${audioElement}
    
    <div class="navigation">
        <button class="nav-btn" id="prevBtn" onclick="goToPrevious()">Previous</button>
        <span>Slide ${index + 1} of ${totalSlides}</span>
        <button class="nav-btn" id="nextBtn" onclick="goToNext()">Next</button>
    </div>
    
    <div class="completion-overlay" id="completionOverlay">
        <div class="completion-message">
            <h3>Please complete this content</h3>
            <p>You must view the entire ${block.type === 'video' ? 'video' : 'document'} before proceeding.</p>
            <button onclick="hideCompletionMessage()">Continue</button>
        </div>
    </div>

    <script>
        let currentSlide = ${index};
        let totalSlides = ${totalSlides};
        let isCompleted = false;
        let audioPlayed = false;
        
        // SCORM API initialization
        let API = null;
        let isInitialized = false;
        
        function initializeSCORM() {
            if (isInitialized) return;
            
            try {
                API = parent.API_1484_11 || window.API_1484_11;
                if (API) {
                    API.Initialize("");
                    // Use valid SCORM 2004 data model elements
                    API.SetValue("cmi.completion_status", "incomplete");
                    API.SetValue("cmi.success_status", "unknown");
                    isInitialized = true;
                    console.log('SCORM API initialized successfully');
                }
            } catch (e) {
                console.log("SCORM API not available:", e);
            }
        }
        
        // Initialize SCORM on page load
        initializeSCORM();
        
        // Audio handling
        ${includeTTS ? `
        function playSlideAudio() {
            if (audioPlayed) return;
            const audio = document.getElementById('slideAudio');
            const progress = document.getElementById('audioProgress');
            const progressFill = document.getElementById('progressFill');
            
            if (audio) {
                audioPlayed = true;
                progress.style.display = 'block';
                
                audio.addEventListener('timeupdate', function() {
                    const percent = (audio.currentTime / audio.duration) * 100;
                    progressFill.style.width = percent + '%';
                });
                
                audio.addEventListener('ended', function() {
                    progress.style.display = 'none';
                    enableNavigation();
                });
                
                audio.play().catch(e => {
                    console.log('Audio play failed:', e);
                    enableNavigation();
                });
            } else {
                enableNavigation();
            }
        }
        
        function enableNavigation() {
            document.getElementById('nextBtn').disabled = false;
        }
        
        // Auto-play audio when slide loads
        window.addEventListener('load', function() {
            playSlideAudio();
        });
        ` : `
        function enableNavigation() {
            document.getElementById('nextBtn').disabled = false;
        }
        
        window.addEventListener('load', function() {
            enableNavigation();
        });
        `}
        
        // Completion tracking for video and document slides
        ${(block.type === 'video' || block.type === 'document') ? `
        function checkCompletion() {
            const currentBlock = ${JSON.stringify(block)};
            if (currentBlock.type === 'video') {
                const video = document.querySelector('video');
                if (video) {
                    video.addEventListener('ended', function() {
                        isCompleted = true;
                        enableNavigation();
                    });
                    
                    // Check if enforceCompletion is disabled
                    if (!currentBlock.data.enforceCompletion) {
                        isCompleted = true;
                        enableNavigation();
                    }
                }
            } else if (currentBlock.type === 'document') {
                // Check if enforceCompletion is disabled
                if (!currentBlock.data.enforceCompletion) {
                    isCompleted = true;
                    enableNavigation();
                } else {
                    // For documents, we'll consider them completed after a certain time
                    setTimeout(function() {
                        isCompleted = true;
                        enableNavigation();
                    }, 5000); // 5 seconds minimum viewing time
                }
            }
        }
        
        checkCompletion();
        ` : `
        isCompleted = true;
        `}
        
        // Simple flashcard functionality - completion card is always visible
        function flipCard(cardIndex) {
            const cards = document.querySelectorAll('.flashcard');
            const card = cards[cardIndex];
            if (card) {
                // Toggle flip state - allow unlimited flipping
                if (card.classList.contains('flipped')) {
                    // Flip back to front
                    card.classList.remove('flipped');
                } else {
                    // Flip to back
                    card.classList.add('flipped');
                }
            }
        }
        
        function restartFlashcards() {
            // Reset all cards
            const cards = document.querySelectorAll('.flashcard');
            cards.forEach(card => {
                card.classList.remove('flipped');
            });
        }
        
        // Accordion functionality
        function toggleAccordion(index) {
            const item = document.querySelectorAll('.accordion-item')[index];
            const body = item.querySelector('.accordion-item-body');
            const icon = item.querySelector('.accordion-icon-plus');
            const iconContainer = item.querySelector('.accordion-item-icon');
            
            if (item.classList.contains('active')) {
                // Closing animation
                item.classList.remove('active');
                body.classList.add('closing');
                body.classList.remove('opening');
                icon.textContent = '+';
                iconContainer.style.transform = 'rotate(0deg)';
                
                setTimeout(() => {
                    body.style.display = 'none';
                    body.classList.remove('closing');
                }, 300);
            } else {
                // Opening animation
                item.classList.add('active');
                body.style.display = 'block';
                body.classList.add('opening');
                body.classList.remove('closing');
                icon.textContent = '×';
                iconContainer.style.transform = 'rotate(45deg)';
                
                setTimeout(() => {
                    body.classList.remove('opening');
                }, 300);
            }
        }
        
        // Hotspot functionality
        function showHotspotInfo(hotspotIndex) {
            const hotspots = ${JSON.stringify(block.data.hotspots)};
            const hotspot = hotspots[hotspotIndex];
            
            if (hotspot) {
                // Create hotspot info overlay
                const overlay = document.createElement('div');
                overlay.className = 'hotspot-info-overlay';
                overlay.innerHTML = '<div class="hotspot-info-card"><div class="hotspot-info-header"><h3 class="hotspot-info-title">' + (hotspot.title || 'Hotspot') + '</h3><button class="hotspot-info-close" onclick="closeHotspotInfo()">×</button></div><div class="hotspot-info-content"><p class="hotspot-info-description">' + (hotspot.description || 'No description available') + '</p></div></div>';
                
                // Append to image wrapper instead of body
                const imageWrapper = document.querySelector('.image-wrapper');
                if (imageWrapper) {
                    imageWrapper.appendChild(overlay);
                    
                    // Position the card relative to the hotspot within the image
                    const hotspotElement = document.querySelector('[onclick="showHotspotInfo(' + hotspotIndex + ')"]');
                    if (hotspotElement) {
                        const wrapperRect = imageWrapper.getBoundingClientRect();
                        const hotspotRect = hotspotElement.getBoundingClientRect();
                        
                        // Calculate position relative to the image wrapper
                        const relativeX = hotspotRect.left - wrapperRect.left;
                        const relativeY = hotspotRect.top - wrapperRect.top;
                        
                        const card = overlay.querySelector('.hotspot-info-card');
                        card.style.position = 'absolute';
                        card.style.left = relativeX + 'px';
                        card.style.top = (relativeY - 120) + 'px';
                        
                        // Ensure card stays within image bounds
                        const cardRect = card.getBoundingClientRect();
                        const wrapperWidth = wrapperRect.width;
                        const wrapperHeight = wrapperRect.height;
                        
                        if (relativeX + cardRect.width > wrapperWidth) {
                            card.style.left = (wrapperWidth - cardRect.width - 10) + 'px';
                        }
                        if (relativeY - 120 < 0) {
                            card.style.top = (relativeY + 40) + 'px';
                        }
                    }
                }
            }
        }
        
        function closeHotspotInfo() {
            const overlay = document.querySelector('.hotspot-info-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
        
        // Close hotspot info when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.hotspot-info-card') && !event.target.closest('.hotspot')) {
                closeHotspotInfo();
            }
        });
        
        // Ensure hotspots are positioned relative to the image, not the container
        function adjustHotspotPositions() {
            const imageWrapper = document.querySelector('.image-wrapper');
            const image = document.querySelector('.hotspot-image');
            const hotspots = document.querySelectorAll('.hotspot');
            
            if (imageWrapper && image && hotspots.length > 0) {
                // Get the actual image dimensions within the wrapper
                const imageRect = image.getBoundingClientRect();
                const wrapperRect = imageWrapper.getBoundingClientRect();
                
                // Calculate the scale factor if the image is scaled
                const scaleX = imageRect.width / image.naturalWidth;
                const scaleY = imageRect.height / image.naturalHeight;
                
                hotspots.forEach((hotspot, index) => {
                    // Get the original percentage position from the hotspot data
                    const hotspots = ${JSON.stringify(block.data.hotspots)};
                    const hotspotData = hotspots[index];
                    
                    if (hotspotData) {
                        // Calculate position relative to the actual image
                        const x = (hotspotData.x / 100) * imageRect.width;
                        const y = (hotspotData.y / 100) * imageRect.height;
                        
                        // Position relative to the image within the wrapper
                        const relativeX = x + (imageRect.left - wrapperRect.left);
                        const relativeY = y + (imageRect.top - wrapperRect.top);
                        
                        hotspot.style.left = relativeX + 'px';
                        hotspot.style.top = relativeY + 'px';
                    }
                });
            }
        }
        
        // Adjust positions when the page loads and when the window resizes
        window.addEventListener('load', adjustHotspotPositions);
        window.addEventListener('resize', adjustHotspotPositions);
        
        function goToNext() {
            console.log('goToNext called, isCompleted:', isCompleted, 'block.type:', '${block.type}');
            
            if (!isCompleted && ('${block.type}' === 'video' || '${block.type}' === 'document')) {
                console.log('Showing completion overlay');
                document.getElementById('completionOverlay').style.display = 'flex';
                return;
            }
            
            // Special handling for checklist slides
            if ('${block.type}' === 'checklist') {
                const checkedItems = document.querySelectorAll('.checklist-checkbox.checked').length;
                const totalItems = document.querySelectorAll('.checklist-checkbox').length;
                
                if (checkedItems < totalItems) {
                    // Check the next unchecked item
                    const uncheckedItems = document.querySelectorAll('.checklist-checkbox.unchecked');
                    if (uncheckedItems.length > 0) {
                        const nextItem = uncheckedItems[0];
                        const itemId = nextItem.getAttribute('onclick').match(/toggleCheckbox\\('([^']+)'\\)/)[1];
                        toggleCheckbox(itemId);
                        return;
                    }
                } else {
                    // All items are checked, proceed to next slide
                    console.log('All checklist items completed, proceeding to next slide');
                }
            }
            
            // Special handling for quiz slides
            if ('${block.type}' === 'quiz') {
                const currentQuestion = document.querySelector('.quiz-question-slide:not([style*="display: none"])');
                if (currentQuestion) {
                    const nextBtn = currentQuestion.querySelector('.quiz-next-btn');
                    if (nextBtn && nextBtn.style.display === 'none') {
                        console.log('Quiz question not answered correctly yet');
                        return;
                    }
                }
            }
            
            if (currentSlide < totalSlides - 1) {
                console.log('Navigating to slide:', currentSlide + 2);
                window.location.href = 'slide_' + (currentSlide + 2) + '.html';
            } else {
                console.log('Course completed');
                // Course completed
                if (API) {
                    API.SetValue("cmi.completion_status", "completed");
                    API.SetValue("cmi.success_status", "passed");
                    API.Commit("");
                    API.Terminate("");
                }
                alert('Course completed!');
            }
        }
        
        function goToPrevious() {
            console.log('goToPrevious called, currentSlide:', currentSlide);
            if (currentSlide > 0) {
                console.log('Navigating to slide:', currentSlide);
                window.location.href = 'slide_' + currentSlide + '.html';
            } else {
                console.log('Already at first slide');
            }
        }
        
        function hideCompletionMessage() {
            document.getElementById('completionOverlay').style.display = 'none';
        }
        
        // Disable next button initially for completion-required slides
        ${(block.type === 'video' || block.type === 'document') ? `
        document.getElementById('nextBtn').disabled = true;
        ` : ''}
        
        // Download text file function
        function downloadTextFile(filename, content) {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
        
        // PDF handling functions
        let pdfLoadTimeout;
        
        function handlePDFLoad() {
            console.log('PDF loaded successfully');
            clearTimeout(pdfLoadTimeout);
            const fallback = document.getElementById('pdfFallback');
            if (fallback) {
                fallback.style.display = 'none';
            }
        }
        
        function handlePDFError() {
            console.log('PDF failed to load, showing fallback');
            clearTimeout(pdfLoadTimeout);
            const fallback = document.getElementById('pdfFallback');
            if (fallback) {
                fallback.style.display = 'block';
            }
        }
        
        // Set up PDF loading timeout
        function setupPDFTimeout() {
            pdfLoadTimeout = setTimeout(() => {
                console.log('PDF loading timeout, showing fallback');
                const fallback = document.getElementById('pdfFallback');
                if (fallback) {
                    fallback.style.display = 'block';
                }
            }, 10000); // 10 second timeout
        }
        
        // Initialize PDF viewer when page loads
        window.addEventListener('load', function() {
            const iframe = document.querySelector('.pdf-iframe');
            if (iframe) {
                setupPDFTimeout();
            }
        });
        
        function toggleFullscreen() {
            const iframe = document.querySelector('.pdf-iframe');
            if (iframe) {
                if (iframe.requestFullscreen) {
                    iframe.requestFullscreen();
                } else if (iframe.webkitRequestFullscreen) {
                    iframe.webkitRequestFullscreen();
                } else if (iframe.msRequestFullscreen) {
                    iframe.msRequestFullscreen();
                }
            }
        }
        
        // Checklist functionality
        function toggleCheckbox(itemId) {
            const checkbox = document.querySelector('[onclick="toggleCheckbox(\\'' + itemId + '\\')"]');
            const itemContainer = checkbox.closest('.checklist-item');
            
            if (checkbox) {
                // Add animation class for smooth transition
                checkbox.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                
                // Toggle classes with a slight delay for better visual feedback
                setTimeout(() => {
                    checkbox.classList.toggle('checked');
                    checkbox.classList.toggle('unchecked');
                    
                    // Update the checkmark SVG with animation
                    if (checkbox.classList.contains('checked')) {
                        checkbox.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" style="animation: checkmarkAppear 0.4s ease-out;"><path d="M7 14L12.5 19.5L21 7" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>';
                        itemContainer.classList.add('checked');
                    } else {
                        checkbox.innerHTML = '';
                        itemContainer.classList.remove('checked');
                    }
                    
                    updateProgress();
                }, 100);
            }
        }
        
        function updateProgress() {
            // Update SCORM progress if API is available
            if (API) {
                try {
                    const checkedItems = document.querySelectorAll('.checklist-checkbox.checked').length;
                    const totalItems = document.querySelectorAll('.checklist-checkbox').length;
                    const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
                    
                    API.SetValue("cmi.progress_measure", (progress / 100).toString());
                    
                    if (progress === 100) {
                        API.SetValue("cmi.completion_status", "completed");
                        API.SetValue("cmi.success_status", "passed");
                    }
                } catch (e) {
                    console.log("Error updating SCORM progress:", e);
                }
            }
            
            // Update Next button state
            updateNextButtonState();
        }
        
        function updateNextButtonState() {
            const checkedItems = document.querySelectorAll('.checklist-checkbox.checked').length;
            const totalItems = document.querySelectorAll('.checklist-checkbox').length;
            const nextBtn = document.getElementById('nextBtn');
            
            if (nextBtn) {
                // For checklist slides, enable button if there are items to check or if all are checked
                if ('${block.type}' === 'checklist') {
                    if (totalItems > 0) {
                        nextBtn.disabled = false;
                        nextBtn.style.background = '#3b82f6';
                        nextBtn.style.cursor = 'pointer';
                        
                        // Update button text based on state
                        if (checkedItems === totalItems) {
                            nextBtn.textContent = 'Next';
                        } else {
                            nextBtn.textContent = 'Check Next Item';
                        }
                    } else {
                        nextBtn.disabled = true;
                        nextBtn.style.background = '#6b7280';
                        nextBtn.style.cursor = 'not-allowed';
                    }
                } else {
                    // For other slide types, use original logic
                    if (checkedItems === totalItems && totalItems > 0) {
                        nextBtn.disabled = false;
                        nextBtn.style.background = '#3b82f6';
                        nextBtn.style.cursor = 'pointer';
                    } else {
                        nextBtn.disabled = true;
                        nextBtn.style.background = '#6b7280';
                        nextBtn.style.cursor = 'not-allowed';
                    }
                }
            }
        }
        
        // Initialize Next button state on page load
        document.addEventListener('DOMContentLoaded', function() {
            updateNextButtonState();
        });
        
        // Quiz functionality
        let quizScore = 0;
        let totalQuestions = 0;
        let currentQuestionIndex = 0;
        let answeredQuestions = 0;
        
        function startQuiz() {
            // Hide start slide and show first question
            const startSlide = document.querySelector('.quiz-start-slide');
            if (startSlide) {
                startSlide.style.display = 'none';
            }
            
            // Show first question
            currentQuestionIndex = 0;
            showQuestion(currentQuestionIndex);
        }
        
        function showQuestion(questionIndex) {
            // Hide all questions
            const allQuestions = document.querySelectorAll('.quiz-question-slide');
            allQuestions.forEach(question => {
                question.style.display = 'none';
            });
            
            // Hide finish slide
            const finishSlide = document.querySelector('.quiz-finish-slide');
            if (finishSlide) {
                finishSlide.style.display = 'none';
            }
            
            // Show the specified question
            const targetQuestion = document.querySelector('[data-question-index="' + questionIndex + '"]');
            if (targetQuestion) {
                targetQuestion.style.display = 'block';
            }
        }
        
        function goToNextQuestion() {
            currentQuestionIndex++;
            
            // Check if there are more questions
            if (currentQuestionIndex < totalQuestions) {
                showQuestion(currentQuestionIndex);
            } else {
                // No more questions, show finish slide
                showFinishSlide();
            }
        }
        
        function goToPreviousQuestion() {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                showQuestion(currentQuestionIndex);
            } else {
                // Go back to start slide
                const startSlide = document.querySelector('.quiz-start-slide');
                const allQuestions = document.querySelectorAll('.quiz-question-slide');
                const finishSlide = document.querySelector('.quiz-finish-slide');
                
                if (startSlide) {
                    startSlide.style.display = 'block';
                }
                allQuestions.forEach(question => {
                    question.style.display = 'none';
                });
                if (finishSlide) {
                    finishSlide.style.display = 'none';
                }
            }
        }
        
        function showFinishSlide() {
            // Hide all questions
            const allQuestions = document.querySelectorAll('.quiz-question-slide');
            allQuestions.forEach(question => {
                question.style.display = 'none';
            });
            
            // Show finish slide
            const finishSlide = document.querySelector('.quiz-finish-slide');
            if (finishSlide) {
                finishSlide.style.display = 'block';
                updateQuizScore();
            }
        }
        
        function submitAnswer(questionIndex) {
            const questionSlide = document.querySelector('[data-question-index="' + questionIndex + '"]');
            const questionType = questionSlide.getAttribute('data-question-type');
            const feedbackDiv = document.getElementById('feedback-' + questionIndex);
            const submitBtn = questionSlide.querySelector('.quiz-submit-btn');
            const nextBtn = questionSlide.querySelector('.quiz-next-btn');
            
            let isCorrect = false;
            
            switch (questionType) {
                case 'mcq':
                    isCorrect = checkMCQAnswer(questionIndex);
                    break;
                case 'multiple':
                    isCorrect = checkMultipleAnswer(questionIndex);
                    break;
                case 'true-false':
                    isCorrect = checkTrueFalseAnswer(questionIndex);
                    break;
                case 'short-answer':
                    isCorrect = checkShortAnswer(questionIndex);
                    break;
                case 'fill-blank':
                    isCorrect = checkFillBlankAnswer(questionIndex);
                    break;
                case 'match':
                    isCorrect = checkMatchAnswer(questionIndex);
                    break;
                case 'sequence':
                    isCorrect = checkSequenceAnswer(questionIndex);
                    break;
            }
            
            // Show feedback
            if (isCorrect) {
                feedbackDiv.innerHTML = '<div class="correct-feedback">✓ Correct!</div>';
                feedbackDiv.style.color = '#10b981';
                quizScore++;
                
                // Hide submit button and show next button
                submitBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
                
                answeredQuestions++;
                updateQuizScore();
            } else {
                feedbackDiv.innerHTML = '<div class="incorrect-feedback">✗ Incorrect. Try again.</div>';
                feedbackDiv.style.color = '#ef4444';
                // Keep submit button visible for retry
            }
            
            feedbackDiv.style.display = 'block';
        }
        
        function checkMCQAnswer(questionIndex) {
            const selectedOption = document.querySelector('input[name="question-' + questionIndex + '"]:checked');
            return selectedOption && selectedOption.getAttribute('data-correct') === 'true';
        }
        
        function checkMultipleAnswer(questionIndex) {
            const selectedOptions = document.querySelectorAll('input[name="question-' + questionIndex + '"]:checked');
            const correctOptions = document.querySelectorAll('input[name="question-' + questionIndex + '"][data-correct="true"]');
            
            if (selectedOptions.length !== correctOptions.length) return false;
            
            for (let option of selectedOptions) {
                if (option.getAttribute('data-correct') !== 'true') return false;
            }
            return true;
        }
        
        function checkTrueFalseAnswer(questionIndex) {
            const selectedOption = document.querySelector('input[name="question-' + questionIndex + '"]:checked');
            return selectedOption && selectedOption.getAttribute('data-correct') === 'true';
        }
        
        function checkShortAnswer(questionIndex) {
            const userAnswer = document.getElementById('short-answer-' + questionIndex).value.trim();
            const questionSlide = document.querySelector('[data-question-index="' + questionIndex + '"]');
            const correctAnswers = questionSlide.querySelector('.quiz-correct-answers');
            const caseSensitive = questionSlide.getAttribute('data-case-sensitive') === 'true';
            
            if (!userAnswer) return false;
            
            // Get correct answers from data attributes or hidden elements
            const correctAnswersText = correctAnswers ? 
                Array.from(correctAnswers.querySelectorAll('.correct-answer')).map(el => el.textContent.trim()) :
                ['Sample Answer']; // Fallback
            
            for (let correctAnswer of correctAnswersText) {
                let userAnswerToCheck = userAnswer;
                let correctAnswerToCheck = correctAnswer;
                
                if (!caseSensitive) {
                    userAnswerToCheck = userAnswer.toLowerCase();
                    correctAnswerToCheck = correctAnswer.toLowerCase();
                }
                
                // Check for exact match or 80% similarity
                if (userAnswerToCheck === correctAnswerToCheck || 
                    calculateSimilarity(userAnswerToCheck, correctAnswerToCheck) >= 0.8) {
                    return true;
                }
            }
            return false;
        }
        
        function checkFillBlankAnswer(questionIndex) {
            const selects = document.querySelectorAll('[data-question-index="' + questionIndex + '"] .quiz-blank-select');
            for (let select of selects) {
                const correctAnswer = select.getAttribute('data-correct');
                if (select.value !== correctAnswer) return false;
            }
            return true;
        }
        
        function checkMatchAnswer(questionIndex) {
            const selects = document.querySelectorAll('[data-question-index="' + questionIndex + '"] .quiz-match-option');
            for (let select of selects) {
                const correctAnswer = select.getAttribute('data-correct');
                if (select.value !== correctAnswer) return false;
            }
            return true;
        }
        
        function checkSequenceAnswer(questionIndex) {
            const sequenceContainer = document.querySelector('[data-question-index="' + questionIndex + '"] .quiz-sequence-items');
            const correctSequence = sequenceContainer.getAttribute('data-correct-sequence');
            const currentSequence = Array.from(sequenceContainer.querySelectorAll('.quiz-sequence-item'))
                .map(item => item.getAttribute('data-original-text'))
                .join(',');
            return currentSequence === correctSequence;
        }
        
        function calculateSimilarity(str1, str2) {
            const longer = str1.length > str2.length ? str1 : str2;
            const shorter = str1.length > str2.length ? str2 : str1;
            if (longer.length === 0) return 1.0;
            return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
        }
        
        function levenshteinDistance(str1, str2) {
            const matrix = [];
            for (let i = 0; i <= str2.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= str1.length; j++) {
                matrix[0][j] = j;
            }
            for (let i = 1; i <= str2.length; i++) {
                for (let j = 1; j <= str1.length; j++) {
                    if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            return matrix[str2.length][str1.length];
        }
        
        function updateQuizScore() {
            const scoreElement = document.getElementById('quiz-score');
            if (scoreElement && totalQuestions > 0) {
                const percentage = Math.round((quizScore / totalQuestions) * 100);
                scoreElement.textContent = percentage;
            }
        }
        
        function continueCourse() {
            if (currentSlide < totalSlides - 1) {
                window.location.href = 'slide_' + (currentSlide + 2) + '.html';
            } else {
                // Course completed
                if (API) {
                    API.SetValue("cmi.completion_status", "completed");
                    API.SetValue("cmi.success_status", "passed");
                    API.Commit("");
                    API.Terminate("");
                }
                alert('Course completed!');
            }
        }
        
        // Initialize quiz on page load
        document.addEventListener('DOMContentLoaded', function() {
            const quizQuestions = document.querySelectorAll('.quiz-question-slide');
            totalQuestions = quizQuestions.length;
            
            // Hide all questions initially
            quizQuestions.forEach(question => {
                question.style.display = 'none';
            });
            
            // Hide finish slide initially
            const finishSlide = document.querySelector('.quiz-finish-slide');
            if (finishSlide) {
                finishSlide.style.display = 'none';
            }
            
            // Set up drag and drop for sequence questions
            quizQuestions.forEach(question => {
                if (question.getAttribute('data-question-type') === 'sequence') {
                    setupSequenceDragDrop(question);
                }
            });
        });
        
        function setupSequenceDragDrop(questionContainer) {
            const items = questionContainer.querySelectorAll('.quiz-sequence-item');
            items.forEach(item => {
                item.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', '');
                    this.style.opacity = '0.5';
                });
                
                item.addEventListener('dragend', function(e) {
                    this.style.opacity = '1';
                });
                
                item.addEventListener('dragover', function(e) {
                    e.preventDefault();
                });
                
                item.addEventListener('drop', function(e) {
                    e.preventDefault();
                    const draggedItem = document.querySelector('.quiz-sequence-item[style*="opacity: 0.5"]');
                    if (draggedItem && draggedItem !== this) {
                        const parent = this.parentNode;
                        const nextSibling = this.nextSibling;
                        parent.insertBefore(draggedItem, nextSibling);
                        
                        // Update numbers
                        updateSequenceNumbers(parent);
                    }
                });
            });
        }
        
        function updateSequenceNumbers(container) {
            const items = container.querySelectorAll('.quiz-sequence-item');
            items.forEach((item, index) => {
                const numberElement = item.querySelector('.quiz-sequence-number');
                if (numberElement) {
                    numberElement.textContent = index + 1;
                }
            });
        }
    </script>
</body>
</html>`;
}

// Helper function to generate slide content based on type
async function generateSlideContent(block) {
  switch (block.type) {
    case 'welcome':
      return generateWelcomeContent(block);
    case 'text-image':
      return generateTextImageContent(block);
    case 'video':
      return generateVideoContent(block);
    case 'document':
      return await generateDocumentContent(block);
    case 'flashcards':
      return generateFlashcardContent(block);
    case 'hotspot':
      return generateHotspotContent(block);
    case 'accordion':
      return generateAccordionContent(block);
    case 'checklist':
      return generateChecklistContent(block);
    case 'embed':
      return generateEmbedContent(block);
    case 'course-completed':
      return generateCourseCompletedContent(block);
    case 'quiz':
      return generateQuizContent(block);
    default:
      return `<h1>${block.title}</h1><p>Content type not supported</p>`;
  }
}

// Generate content for each slide type
function generateWelcomeContent(block) {
  return `
    <div class="welcome-slide">
      <div class="welcome-gradient"></div>
      <div class="welcome-content">
        <h1 class="welcome-title">${block.data.title || 'Welcome to the Course'}</h1>
        ${block.data.duration ? `<div class="welcome-duration">⏱️ ${block.data.duration} minutes</div>` : ''}
        ${block.data.description ? `<div class="welcome-description">${block.data.description}</div>` : ''}
        <button class="welcome-start-btn" onclick="goToNext()">Start Course</button>
      </div>
    </div>
  `;
}

function generateTextImageContent(block) {
  const layout = block.data.layout || 'right';
  console.log('Text-Image Layout Debug:', { 
    blockId: block.id, 
    layout: layout, 
    hasImage: !!block.data.image,
    blockData: block.data 
  });
  
  const imageHtml = block.data.image ? `<img src="${block.data.image}" alt="${block.data.altText || ''}" class="main-image">` : '';
  
  // Handle different layout types - match frontend class names exactly
  let layoutClass = `layout-${layout}`;
  let backgroundStyle = '';
  
  if (layout === 'behind' && block.data.image) {
    backgroundStyle = `style="background-image: url('${block.data.image}'); background-size: cover; background-position: center; background-repeat: no-repeat;"`;
  }
  
  // Match frontend HTML structure exactly: text-image-content, text-content wrapper, text-title, text-body
  // And image-section > image-container > main-image structure
  return `
    <div class="text-image-content ${layoutClass}" ${backgroundStyle}>
      <div class="text-section ${layout === 'behind' ? 'layout-behind' : ''}">
        <div class="text-content">
          <h1 class="text-title">${block.data.title || 'Untitled'}</h1>
          <div class="text-body">${block.data.content || ''}</div>
      </div>
      </div>
      ${layout !== 'none' && layout !== 'behind' ? `<div class="image-section"><div class="image-container">${imageHtml}</div></div>` : ''}
    </div>
  `;
}

function generateVideoContent(block) {
  // Handle video URLs properly for LMS compatibility
  let videoSrc = block.data.videoUrl;
  let videoFileName = '';
  
  console.log(`🎬 GENERATING VIDEO CONTENT for block ${block.id}`);
  console.log(`   - Input videoSrc: ${videoSrc}`);
  
  if (videoSrc && videoSrc.startsWith('blob:')) {
    // For blob URLs, we need to convert them to data URLs or handle them differently
    console.log('Blob URL detected for video:', videoSrc);
    // Use a placeholder or convert to data URL
    videoFileName = `video_${block.id}.mp4`;
    videoSrc = videoFileName; // This will need to be handled during file processing
  } else if (videoSrc && videoSrc.startsWith('data:')) {
    // Handle data URLs by extracting and saving as file
    console.log('Data URL detected for video');
    videoFileName = `video_${block.id}.mp4`;
    videoSrc = videoFileName;
  } else if (videoSrc && (videoSrc.startsWith('http') || videoSrc.startsWith('https'))) {
    // External URL (including S3 URLs) - use as is
    console.log('✅ External video URL (including S3):', videoSrc);
    // Keep the S3 URL as is
  } else if (videoSrc) {
    // Other video sources
    console.log('Other video source:', videoSrc);
  } else {
    // No video URL
    console.log('❌ No video URL found');
    videoSrc = '';
  }
  
  console.log(`   - Final videoSrc: ${videoSrc}`);
  
  const htmlContent = `
    <div class="video-slide">
      <h1 class="video-title">${block.data.title || 'Video Content'}</h1>
      ${block.data.description ? `<div class="video-description">${block.data.description}</div>` : ''}
      <div class="video-container">
        ${videoSrc ? `
        <video 
          controls 
          class="video-element"
          preload="metadata"
          onloadstart="console.log('Video loading started')"
          oncanplay="console.log('Video can play')"
          onerror="console.error('Video load error:', event)"
        >
          <source src="${videoSrc}" type="video/mp4">
          <source src="${videoSrc}" type="video/webm">
          <source src="${videoSrc}" type="video/ogg">
          Your browser does not support the video tag.
        </video>
        ` : `
        <div class="video-placeholder">
          <p>No video available</p>
        </div>
        `}
      </div>
    </div>
  `;
  
  console.log(`   - Generated HTML contains video source: ${videoSrc}`);
  return htmlContent;
}

async function generateDocumentContent(block) {
  console.log(`📄 GENERATING DOCUMENT CONTENT for block ${block.id}`);
  console.log(`   - Document URL: ${block.data.documentUrl}`);
  console.log(`   - File type: ${block.data.fileType}`);
  console.log(`   - File name: ${block.data.fileName}`);
  console.log(`   - Has DOCX content: ${!!block.data.docxContent}`);
  
  // Use the enhanced document service to generate appropriate HTML
  const documentInfo = {
    s3Url: block.data.documentUrl,
    fileType: block.data.fileType,
    fileName: block.data.fileName,
    docxContent: block.data.docxContent
  };
  
  const documentHTML = documentService.generateDocumentHTML(block, documentInfo);
  
  const htmlContent = `
    <div class="document-slide">
      <h1 class="document-title">${block.data.title || 'Document Content'}</h1>
      ${block.data.description ? `<div class="document-description">${block.data.description}</div>` : ''}
      <div class="document-container">
        ${documentHTML}
      </div>
    </div>
  `;
  
  console.log(`   - Generated enhanced document HTML`);
  return htmlContent;
}

function generateFlashcardContent(block) {
  console.log(`📚 Generating flashcard content for ${block.data.cards.length} cards`);
  
  const cardsHtml = block.data.cards.map((card, index) => {
    console.log(`   - Card ${index + 1}: ${card.frontTitle || 'Untitled'}`);
    
    const imageHtml = card.image ? `
      <div class="card-image-container">
        <img src="${card.image}" alt="Card image" class="card-image" />
      </div>
    ` : '';
    
    return `
    <div class="flashcard" onclick="flipCard(${index})">
      <div class="card-content">
        <div class="card-front">
          ${imageHtml}
          <div class="card-text">
            <h3>${card.frontTitle || 'Card title'}</h3>
            <p>${card.frontDescription || 'Add a description'}</p>
          </div>
        </div>
        <div class="card-back">
          <p>${card.back || 'Add answer here'}</p>
        </div>
      </div>
      <div class="card-footer">
        <button class="flip-btn" onclick="event.stopPropagation(); flipCard(${index})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  }).join('');
  
  return `
    <div class="flashcard-slide">
      <div class="flashcard-content">
        <div class="flashcard-title-section">
          <h1 class="flashcard-title">${block.data.title || 'Untitled'}</h1>
          <div class="flashcard-description">${block.data.description || 'Add a description'}</div>
        </div>
        <div class="flashcards-container horizontal">
          ${cardsHtml}
          
          <div class="completion-card">
            <div class="completion-content">
              <h2 class="completion-title">All done!</h2>
              <p class="completion-text">Continue to the next screen</p>
              <div class="completion-actions">
                <button class="completion-btn refresh-btn" onclick="restartFlashcards()">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                  </svg>
                </button>
                <button class="completion-btn continue-btn" onclick="goToNext()">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <button class="flashcard-next-btn" id="nextCardBtn" onclick="goToNext()">Continue</button>
      </div>
    </div>
  `;
}

function generateHotspotContent(block) {
  console.log(`🎯 Generating hotspot content for ${block.data.hotspots.length} hotspots`);
  
  const hotspotsHtml = block.data.hotspots.map((hotspot, index) => {
    console.log(`   - Hotspot ${index + 1}: ${hotspot.title || 'Untitled'} at (${hotspot.x}%, ${hotspot.y}%)`);
    console.log(`   - Generated HTML for hotspot ${index + 1}: left: ${hotspot.x}%, top: ${hotspot.y}%`);
    
    return `
    <div class="hotspot" style="left: ${hotspot.x}%; top: ${hotspot.y}%;" onclick="showHotspotInfo(${index})">
      <div class="hotspot-marker" style="background-color: ${hotspot.color || '#3b82f6'};">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14"/>
          <path d="M5 12h14"/>
        </svg>
      </div>
    </div>
  `;
  }).join('');
  
  return `
    <div class="hotspot-slide">
      <div class="hotspot-content">
        <div class="hotspot-title-section">
          <h1 class="hotspot-title">${block.data.title || 'Interactive Image'}</h1>
          <div class="hotspot-description">${block.data.description || 'Add a description'}</div>
        </div>
        <div class="hotspot-container">
          <div class="image-wrapper">
            <img src="${block.data.imageUrl}" alt="${block.data.altText || ''}" class="hotspot-image">
            ${hotspotsHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateAccordionContent(block) {
  const itemsHtml = block.data.items.map((item, index) => {
    // Handle different color storage formats
    let itemColor = '#3b82f6'; // default color
    
    if (item.color) {
      itemColor = item.color;
    } else if (block.data.itemColors && block.data.itemColors[item.id]) {
      itemColor = block.data.itemColors[item.id];
    } else if (item.colors && item.colors[item.id]) {
      itemColor = item.colors[item.id];
    }
    
    return `
    <div class="accordion-item" data-index="${index}">
      <div class="accordion-item-header" onclick="toggleAccordion(${index})">
        <div class="accordion-item-icon" style="background-color: ${itemColor};">
          <span class="accordion-icon-plus">+</span>
        </div>
        <div class="accordion-item-content">
          <div class="accordion-item-title">${item.title}</div>
        </div>
      </div>
      <div class="accordion-item-body">
        <div class="accordion-item-description">${item.description || item.content || 'Add a description'}</div>
      </div>
    </div>
  `;
  }).join('');
  
  return `
    <div class="accordion-slide">
      <div class="accordion-content">
        <div class="accordion-main">
          <h1 class="accordion-title">${block.data.title || 'Accordion Content'}</h1>
          ${block.data.description ? `<div class="accordion-description">${block.data.description}</div>` : ''}
          <div class="accordion-items">
            ${itemsHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateChecklistContent(block) {
  const renderChecklistItem = (item, index, isChild = false) => {
    const itemId = `item_${index}`;
    const itemClass = isChild ? 'checklist-item sublist-item' : 'checklist-item';
    
    let childrenHtml = '';
    if (item.children && item.children.length > 0) {
      childrenHtml = '<div class="sublist-container">' +
        item.children.map((child, childIndex) => 
          renderChecklistItem(child, index + '_' + childIndex, true)
        ).join('') +
        '</div>';
    }
    
    return '<div class="' + itemClass + '">' +
      '<div class="checklist-item-content">' +
        '<div class="checklist-checkbox unchecked" onclick="toggleCheckbox(\'' + itemId + '\')">' +
        '</div>' +
        '<label class="checklist-item-text" onclick="toggleCheckbox(\'' + itemId + '\')">' + item.text + '</label>' +
      '</div>' +
      childrenHtml +
      '</div>';
  };

  const itemsHtml = block.data.items.map((item, index) => 
    renderChecklistItem(item, index)
  ).join('');
  
  return '<div class="checklist-slide">' +
    '<h1 class="checklist-title">' + (block.data.title || 'Checklist') + '</h1>' +
    '<div class="checklist-container">' +
    itemsHtml +
    '</div>' +
    '</div>';
}

function generateEmbedContent(block) {
  return `
    <div class="embed-slide">
      <h1 class="embed-title">${block.data.title || 'Embedded Content'}</h1>
      ${block.data.description ? `<div class="embed-description">${block.data.description}</div>` : ''}
      <div class="embed-container">
        <iframe src="${block.data.url}" class="embed-iframe"></iframe>
      </div>
    </div>
  `;
}

function generateCourseCompletedContent(block) {
  return `
    <div class="course-completed-slide">
      <div class="completion-content">
        <h1 class="completion-title">${block.data.title || "You're all done!"}</h1>
        <p class="completion-subtitle">${block.data.subtitle || "How was your course experience?"}</p>
        <div class="completion-emoji">🎉</div>
        <button class="completion-cta">${block.data.ctaText || "Create your own course"}</button>
      </div>
    </div>
  `;
}

// Helper function to get slide-specific styles
function getSlideSpecificStyles(type) {
  const baseStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
    
    * { font-family: "Poppins", sans-serif; }
    
    .welcome-slide { position: relative; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%); color: white; display: flex; align-items: center; justify-content: center; }
    .welcome-gradient { position: absolute; top: -50%; right: -20%; width: 60%; height: 200%; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%); border-radius: 50%; opacity: 0.3; transform: rotate(-15deg); }
    .welcome-content { text-align: center; z-index: 10; position: relative; max-width: 600px; padding: 2rem; }
    .welcome-title { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; }
    .welcome-duration { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 2rem; color: #cbd5e1; }
    .welcome-description { font-size: 1.2rem; margin-bottom: 2rem; }
    .welcome-start-btn { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 1rem 2rem; border-radius: 2rem; border: none; font-size: 1.125rem; font-weight: 600; cursor: pointer; }
    
    /* Checklist Styles */
    .checklist-slide { max-width: 1200px; margin: 0 auto; padding: 4rem; background: white; border-radius: 20px; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15); min-height: 85vh; display: flex; flex-direction: column; justify-content: center; }
    .checklist-title { font-size: 4.5rem; font-weight: 700; color: #1f2937; margin: 0 0 4rem 0; text-align: center; }
    .checklist-container { display: flex; flex-direction: column; gap: 0; width: 100%; }
    .checklist-item { display: flex; flex-direction: column; padding: 30px 0; background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; position: relative; margin-bottom: 25px; min-height: 100px; width: 100%; }
    .checklist-item-content { display: flex; align-items: flex-start; width: 100%; }
    .checklist-checkbox { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; margin-right: 30px; transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); flex-shrink: 0; transform: scale(1); }
    .checklist-checkbox:hover { transform: scale(1.1); transition: transform 0.3s ease; }
    .checklist-checkbox.checked { background: #3b82f6; color: white; transform: scale(1.05); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); }
    .checklist-checkbox.unchecked { background: transparent; border: 4px dashed #d1d5db; transform: scale(1); }
    .checklist-checkbox.unchecked::before { content: '✓'; color: #d1d5db; font-size: 28px; font-weight: bold; transition: all 0.4s ease; }
    .checklist-checkbox.unchecked:hover { border-color: #9ca3af; transform: scale(1.05); }
    .checklist-checkbox.unchecked:hover::before { color: #9ca3af; transform: scale(1.1); }
    .checklist-item-text { font-size: 32px; color: #374151; cursor: pointer; font-weight: 500; line-height: 1.6; transition: all 0.4s ease; }
    .checklist-item:hover .checklist-item-text { color: #1f2937; transform: translateX(5px); }
    .checklist-item.checked .checklist-item-text { color: #6b7280; text-decoration: line-through; opacity: 0.8; }
    
    /* Animation keyframes */
    @keyframes checkmarkAppear {
        0% { transform: scale(0) rotate(-45deg); opacity: 0; }
        50% { transform: scale(1.2) rotate(0deg); opacity: 0.8; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    @keyframes checkboxPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1.05); }
    }
    
    /* Sublist Styles */
    .sublist-container { border-left: 3px solid #e5e7eb; padding-left: 15px; margin-top: 15px; margin-bottom: 15px; }
    .sublist-item { margin-left: 0; margin-bottom: 15px; position: relative; display: flex; align-items: flex-start; width: 100%; }
    .sublist-item::before { content: ''; position: absolute; left: -15px; top: 50%; width: 10px; height: 3px; background: #e5e7eb; transform: translateY(-50%); }
    .sublist-item .checklist-checkbox { width: 45px; height: 45px; margin-right: 25px; }
    .sublist-item .checklist-item-text { font-size: 28px; color: #6b7280; }
    
    /* Quiz Styles */
    .quiz-start-slide, .quiz-finish-slide, .quiz-question-slide { 
      max-width: 1200px; margin: 0 auto; padding: 4rem; background: white; 
      border-radius: 20px; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15); 
      min-height: 85vh; display: flex; flex-direction: column; justify-content: center; 
      text-align: center; 
    }
    .quiz-start-title, .quiz-finish-title { font-size: 3.5rem; font-weight: 700; color: #7c3aed; margin: 0 0 1.5rem 0; line-height: 1.2; }
    .quiz-start-content, .quiz-finish-message { font-size: 1.5rem; color: #374151; margin: 0 0 3rem 0; font-weight: 400; }
    .quiz-question-count { font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem; }
    .quiz-get-started-btn, .quiz-continue-btn { 
      background: #8b5cf6; color: white; border: none; padding: 1.25rem 2.5rem; 
      border-radius: 12px; font-size: 1.25rem; font-weight: 600; cursor: pointer; 
      transition: all 0.3s; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3); 
      display: flex; align-items: center; gap: 0.75rem; margin: 0 auto; 
    }
    .quiz-get-started-btn:hover, .quiz-continue-btn:hover { 
      background: #7c3aed; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4); 
    }
    .quiz-score-display { font-size: 1.5rem; font-weight: 600; color: #7c3aed; margin-bottom: 2rem; }
    
    /* Quiz Question Styles */
    .quiz-question-title { font-size: 2rem; font-weight: 600; color: #1f2937; margin-bottom: 2rem; text-align: left; }
    .quiz-options-container { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
    .quiz-option { 
      display: flex; align-items: center; gap: 1rem; padding: 1rem; 
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; 
      cursor: pointer; transition: all 0.2s ease; 
    }
    .quiz-option:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .quiz-option input[type="radio"], .quiz-option input[type="checkbox"] { 
      width: 18px; height: 18px; cursor: pointer; 
    }
    .quiz-option-text { font-size: 1rem; color: #374151; font-weight: 500; }
    
    /* Short Answer Styles */
    .quiz-short-answer-container { margin-bottom: 2rem; }
    .quiz-short-answer-input { 
      width: 100%; padding: 1rem; border: 1px solid #d1d5db; border-radius: 8px; 
      font-size: 1rem; color: #374151; background: white; outline: none; 
      transition: all 0.2s ease; 
    }
    .quiz-short-answer-input:focus { 
      border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); 
    }
    
    /* Fill in the Blank Styles */
    .quiz-fill-blank-container { margin-bottom: 2rem; }
    .quiz-sentence-builder { 
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; 
      padding: 1rem; background: #f8fafc; border-radius: 8px; 
    }
    .quiz-sentence-text { 
      background: #e5e7eb; color: #374151; padding: 0.5rem 0.75rem; 
      border-radius: 6px; font-size: 1rem; font-weight: 500; 
    }
    .quiz-blank-select { 
      padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; 
      background: white; font-size: 1rem; color: #374151; 
    }
    
    /* Match Question Styles */
    .quiz-match-container { margin-bottom: 2rem; }
    .quiz-match-pairs { display: flex; flex-direction: column; gap: 1rem; }
    .quiz-match-pair { 
      display: flex; align-items: center; gap: 1rem; padding: 1rem; 
      background: #f8fafc; border-radius: 8px; 
    }
    .quiz-match-item { font-size: 1rem; color: #374151; font-weight: 500; flex: 1; }
    .quiz-match-connector { font-size: 1.5rem; color: #6b7280; }
    .quiz-match-option { 
      padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; 
      background: white; font-size: 1rem; color: #374151; flex: 1; 
    }
    
    /* Sequence Question Styles */
    .quiz-sequence-container { margin-bottom: 2rem; }
    .quiz-sequence-items { display: flex; flex-direction: column; gap: 1rem; }
    .quiz-sequence-item { 
      display: flex; align-items: center; gap: 1rem; padding: 1rem; 
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; 
      cursor: grab; transition: all 0.2s ease; 
    }
    .quiz-sequence-item:hover { background: #f1f5f9; }
    .quiz-sequence-item:active { cursor: grabbing; }
    .quiz-sequence-number { 
      width: 40px; height: 40px; background: #8b5cf6; color: white; 
      border-radius: 50%; display: flex; align-items: center; justify-content: center; 
      font-size: 1rem; font-weight: bold; flex-shrink: 0; 
    }
    .quiz-sequence-text { font-size: 1rem; color: #374151; font-weight: 500; }
    
    /* Quiz Feedback and Controls */
    .quiz-feedback { 
      margin: 1rem 0; padding: 1rem; border-radius: 8px; 
      font-size: 1.125rem; font-weight: 600; text-align: center; 
    }
    .correct-feedback { color: #10b981; }
    .incorrect-feedback { color: #ef4444; }
    .quiz-submit-btn, .quiz-next-btn { 
      background: #8b5cf6; color: white; border: none; padding: 1rem 2rem; 
      border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; 
      transition: all 0.2s ease; margin: 0 auto; display: block; 
    }
    .quiz-submit-btn:hover, .quiz-next-btn:hover { 
      background: #7c3aed; transform: translateY(-1px); 
    }
    
    /* Quiz Navigation */
    .quiz-navigation { 
      display: flex; justify-content: space-between; align-items: center; 
      margin-top: 2rem; padding: 1rem 0; 
    }
    .quiz-prev-btn { 
      background: #6b7280; color: white; border: none; padding: 0.75rem 1.5rem; 
      border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; 
      transition: all 0.2s ease; 
    }
    .quiz-prev-btn:hover { 
      background: #4b5563; transform: translateY(-1px); 
    }
    .quiz-slide-info { 
      font-size: 0.875rem; color: #6b7280; font-weight: 500; 
    }
    
    /* Quiz Finish Slide Enhanced Styles */
    .quiz-finish-slide { 
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1d4ed8 100%) !important; 
      color: white !important; position: relative; overflow: hidden;
    }
    .quiz-finish-slide::before {
      content: ''; position: absolute; top: -50%; right: -20%; width: 60%; height: 200%; 
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #2563eb 100%); 
      border-radius: 50%; opacity: 0.3; transform: rotate(-15deg); z-index: 1;
    }
    .quiz-finish-slide::after {
      content: ''; position: absolute; bottom: -30%; left: -10%; width: 40%; height: 150%; 
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%); 
      border-radius: 50%; opacity: 0.2; transform: rotate(15deg); z-index: 1;
    }
    .quiz-finish-title { color: white !important; position: relative; z-index: 10; }
    .quiz-finish-subtitle { color: rgba(255, 255, 255, 0.9) !important; position: relative; z-index: 10; }
    .quiz-feedback-options { 
      display: flex; justify-content: center; gap: 2rem; margin: 2rem 0; position: relative; z-index: 10; 
    }
    .quiz-feedback-emoji { 
      font-size: 3rem; cursor: pointer; padding: 1rem; border-radius: 50%; 
      transition: all 0.3s ease; background: rgba(255, 255, 255, 0.1); 
    }
    .quiz-feedback-emoji:hover { 
      background: rgba(255, 255, 255, 0.2); transform: scale(1.1); 
    }
    .quiz-feedback-selected { 
      background: rgba(255, 255, 255, 0.3) !important; 
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5); 
    }
    .quiz-score-display { color: white !important; position: relative; z-index: 10; }
    .quiz-continue-btn { 
      background: rgba(255, 255, 255, 0.2) !important; 
      border: 2px solid rgba(255, 255, 255, 0.3) !important; 
      color: white !important; position: relative; z-index: 10; 
    }
    .quiz-continue-btn:hover { 
      background: rgba(255, 255, 255, 0.3) !important; 
      border-color: rgba(255, 255, 255, 0.5) !important; 
    }
  `;
  
  return baseStyles;
}

// Helper function to extract slide content for TTS
function extractSlideContent(block) {
  let content = '';
  
  switch (block.type) {
    case 'welcome':
      content = `${block.data.title || 'Welcome'}. ${block.data.description || ''}`;
      break;
    case 'text-image':
      content = `${block.data.title || 'Content'}. ${block.data.content || ''}`;
      break;
    case 'video':
      content = `${block.data.title || 'Video'}. ${block.data.description || ''}`;
      break;
    case 'document':
      content = `${block.data.title || 'Document'}. ${block.data.description || ''}`;
      break;
    case 'flashcards':
      content = `${block.data.title || 'Flashcards'}. ${block.data.description || ''}`;
      break;
    case 'hotspot':
      content = `${block.data.title || 'Interactive Image'}`;
      break;
    case 'accordion':
      content = `${block.data.title || 'Accordion'}. ${block.data.description || ''}`;
      break;
    case 'checklist':
      content = `${block.data.title || 'Checklist'}`;
      break;
    case 'embed':
      content = `${block.data.title || 'Embedded Content'}. ${block.data.description || ''}`;
      break;
    case 'quiz':
      const questionCount = block.data.questions?.length || 0;
      content = `${block.data.startTitle || 'Test your knowledge'}. ${block.data.startContent || 'Interactive questions'}. This quiz contains ${questionCount} questions.`;
      break;
    case 'course-completed':
      content = `${block.data.title || 'Course Completed'}. ${block.data.subtitle || ''}`;
      break;
    default:
      content = block.title || 'Content';
  }
  
  return content;
}

// Generate quiz content
function generateQuizContent(block) {
  const quizData = block.data;
  let html = '';
  
  // Quiz start page - always show if there are questions
  if (quizData.questions && quizData.questions.length > 0) {
    html += '<div class="quiz-start-slide">';
    html += '<h1 class="quiz-start-title">' + (quizData.startTitle || 'Test your knowledge') + '</h1>';
    html += '<p class="quiz-start-content">' + (quizData.startContent || 'Add your content here...') + '</p>';
    html += '<div class="quiz-question-count">' + (quizData.questions?.length || 0) + ' Questions</div>';
    html += '<button class="quiz-get-started-btn" onclick="startQuiz()">Get Started</button>';
    html += '</div>';
  }
  
  // Quiz questions
  if (quizData.questions && quizData.questions.length > 0) {
    quizData.questions.forEach((question, index) => {
      html += generateQuizQuestion(question, index, quizData.questions.length);
    });
  }
  
  // Quiz finish page - always show if there are questions
  if (quizData.questions && quizData.questions.length > 0) {
    html += '<div class="quiz-finish-slide" style="display: none;">';
    html += '<h1 class="quiz-finish-title">' + (quizData.finishTitle || 'You\'re all done!') + '</h1>';
    html += '<p class="quiz-finish-subtitle">' + (quizData.finishMessage || 'How was your course experience?') + '</p>';
    html += '<div class="quiz-feedback-options">';
    html += '<div class="quiz-feedback-emoji" data-feedback="sad">😢</div>';
    html += '<div class="quiz-feedback-emoji" data-feedback="neutral">😐</div>';
    html += '<div class="quiz-feedback-emoji quiz-feedback-selected" data-feedback="happy">😊</div>';
    html += '</div>';
    html += '<div class="quiz-score-display">Score: <span id="quiz-score">0</span>%</div>';
    html += '<button class="quiz-continue-btn" onclick="continueCourse()">Create your own course</button>';
    html += '</div>';
  }
  
  return html;
}

// Generate individual quiz question
function generateQuizQuestion(question, index, totalQuestions) {
  let html = '<div class="quiz-question-slide" data-question-index="' + index + '" data-question-type="' + question.type + '" style="display: none;">';
  html += '<h2 class="quiz-question-title">' + question.question + '</h2>';
  
  switch (question.type) {
    case 'mcq':
      html += generateMCQQuestion(question, index);
      break;
    case 'multiple':
      html += generateMultipleResponseQuestion(question, index);
      break;
    case 'true-false':
      html += generateTrueFalseQuestion(question, index);
      break;
    case 'short-answer':
      html += generateShortAnswerQuestion(question, index);
      break;
    case 'fill-blank':
      html += generateFillBlankQuestion(question, index);
      break;
    case 'match':
      html += generateMatchQuestion(question, index);
      break;
    case 'sequence':
      html += generateSequenceQuestion(question, index);
      break;
  }
  
  html += '<div class="quiz-feedback" id="feedback-' + index + '" style="display: none;"></div>';
  html += '<button class="quiz-submit-btn" onclick="submitAnswer(' + index + ')">Submit Answer</button>';
  html += '<button class="quiz-next-btn" onclick="goToNextQuestion()" style="display: none;">Next</button>';
  
  // Add navigation controls
  html += '<div class="quiz-navigation">';
  if (index > 0) {
    html += '<button class="quiz-prev-btn" onclick="goToPreviousQuestion()">Previous</button>';
  }
  html += '<span class="quiz-slide-info">Slide ' + (index + 2) + ' of ' + (totalQuestions + 2) + '</span>';
  html += '</div>';
  
  html += '</div>';
  
  return html;
}

// Generate MCQ question
function generateMCQQuestion(question, index) {
  let html = '<div class="quiz-options-container">';
  question.options.forEach((option, optionIndex) => {
    html += '<label class="quiz-option">';
    html += '<input type="radio" name="question-' + index + '" value="' + optionIndex + '" data-correct="' + (optionIndex === question.correctAnswer) + '">';
    html += '<span class="quiz-option-text">' + option + '</span>';
    html += '</label>';
  });
  html += '</div>';
  return html;
}

// Generate Multiple Response question
function generateMultipleResponseQuestion(question, index) {
  let html = '<div class="quiz-options-container">';
  question.options.forEach((option, optionIndex) => {
    const isCorrect = question.correctAnswer.includes(optionIndex);
    html += '<label class="quiz-option">';
    html += '<input type="checkbox" name="question-' + index + '" value="' + optionIndex + '" data-correct="' + isCorrect + '">';
    html += '<span class="quiz-option-text">' + option + '</span>';
    html += '</label>';
  });
  html += '</div>';
  return html;
}

// Generate True/False question
function generateTrueFalseQuestion(question, index) {
  let html = '<div class="quiz-options-container">';
  html += '<label class="quiz-option">';
  html += '<input type="radio" name="question-' + index + '" value="true" data-correct="' + (question.correctAnswer === true) + '">';
  html += '<span class="quiz-option-text">True</span>';
  html += '</label>';
  html += '<label class="quiz-option">';
  html += '<input type="radio" name="question-' + index + '" value="false" data-correct="' + (question.correctAnswer === false) + '">';
  html += '<span class="quiz-option-text">False</span>';
  html += '</label>';
  html += '</div>';
  return html;
}

// Generate Short Answer question
function generateShortAnswerQuestion(question, index) {
  let html = '<div class="quiz-short-answer-container">';
  html += '<input type="text" id="short-answer-' + index + '" class="quiz-short-answer-input" placeholder="Enter your answer">';
  html += '<div class="quiz-correct-answers" style="display: none;">';
  question.correctAnswer.forEach(answer => {
    html += '<span class="correct-answer">' + answer + '</span>';
  });
  html += '</div>';
  html += '</div>';
  return html;
}

// Generate Fill in the Blank question
function generateFillBlankQuestion(question, index) {
  let html = '<div class="quiz-fill-blank-container">';
  html += '<div class="quiz-sentence-builder">';
  
  question.sentenceParts.forEach((part, partIndex) => {
    if (part.type === 'text') {
      html += '<span class="quiz-sentence-text">' + part.text + '</span>';
    } else {
      // Use the first option as the correct answer if selectedAnswer is empty
      const correctAnswer = part.selectedAnswer || (part.options && part.options[0]) || '';
      html += '<select class="quiz-blank-select" data-part-index="' + partIndex + '" data-correct="' + correctAnswer + '">';
      html += '<option value="">Select answer</option>';
      part.options.forEach(option => {
        html += '<option value="' + option + '">' + option + '</option>';
      });
      html += '</select>';
    }
  });
  
  html += '</div></div>';
  return html;
}

// Generate Match question
function generateMatchQuestion(question, index) {
  let html = '<div class="quiz-match-container">';
  html += '<div class="quiz-match-pairs">';
  
  // Filter out empty pairs and provide defaults
  const validPairs = question.matchPairs.filter(pair => pair.item && pair.option);
  
  if (validPairs.length === 0) {
    // Provide default match pairs if none exist
    html += '<div class="quiz-match-pair">';
    html += '<div class="quiz-match-item">Item 1</div>';
    html += '<div class="quiz-match-connector">↔</div>';
    html += '<select class="quiz-match-option" data-pair-index="0" data-correct="Option 1">';
    html += '<option value="">Select match</option>';
    html += '<option value="Option 1">Option 1</option>';
    html += '<option value="Option 2">Option 2</option>';
    html += '</select>';
    html += '</div>';
  } else {
    validPairs.forEach((pair, pairIndex) => {
      html += '<div class="quiz-match-pair">';
      html += '<div class="quiz-match-item">' + pair.item + '</div>';
      html += '<div class="quiz-match-connector">↔</div>';
      html += '<select class="quiz-match-option" data-pair-index="' + pairIndex + '" data-correct="' + pair.option + '">';
      html += '<option value="">Select match</option>';
      validPairs.forEach(p => {
        html += '<option value="' + p.option + '">' + p.option + '</option>';
      });
      html += '</select>';
      html += '</div>';
    });
  }
  
  html += '</div></div>';
  return html;
}

// Generate Sequence question
function generateSequenceQuestion(question, index) {
  // Shuffle the sequence items for display
  const shuffledItems = [...question.sequenceItems].sort(() => Math.random() - 0.5);
  
  let html = '<div class="quiz-sequence-container">';
  html += '<div class="quiz-sequence-items" data-correct-sequence="' + question.sequenceItems.map(item => item.text).join(',') + '">';
  
  shuffledItems.forEach((item, itemIndex) => {
    html += '<div class="quiz-sequence-item" draggable="true" data-original-text="' + item.text + '">';
    html += '<div class="quiz-sequence-number">' + (itemIndex + 1) + '</div>';
    html += '<div class="quiz-sequence-text">' + item.text + '</div>';
    html += '</div>';
  });
  
  html += '</div></div>';
  return html;
}

// Helper function to generate entry HTML
function generateEntryHTML(scormPackage, includeTTS) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${scormPackage.title}</title>
    <script src="scorm_api.js"></script>
    <link rel="stylesheet" href="styles.css">
    <style>
        body { 
            font-family: "Poppins", sans-serif;
            margin: 0; 
            padding: 20px; 
            background: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .course-intro {
            max-width: 800px;
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .course-title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #1f2937;
        }
        .course-description {
            font-size: 1.2rem;
            color: #6b7280;
            margin-bottom: 2rem;
        }
        .start-btn {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 2rem;
            border: none;
            font-size: 1.125rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .start-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
        }
    </style>
</head>
<body>
    <div class="course-intro">
        <h1 class="course-title">${scormPackage.title}</h1>
        ${scormPackage.description ? `<p class="course-description">${scormPackage.description}</p>` : ''}
        <button class="start-btn" onclick="startCourse()">Start Course</button>
    </div>

    <script>
        let API = null;
        let isInitialized = false;
        try {
            API = parent.API_1484_11 || window.API_1484_11;
            if (API && !isInitialized) {
                API.Initialize("");
                // Use valid SCORM 2004 data model elements
                API.SetValue("cmi.completion_status", "incomplete");
                API.SetValue("cmi.success_status", "unknown");
                isInitialized = true;
            }
        } catch (e) {
            console.log("SCORM API not available:", e);
        }
        
        function startCourse() {
            window.location.href = 'slide_1.html';
        }
    </script>
</body>
</html>`;
}

// Note: Video processing is now handled by videoService
// This function is kept for backward compatibility with external URLs
async function processVideoForSCORM(block, assetsDir) {
  try {
    const videoUrl = block.data.videoUrl;
    const videoFileName = `video_${block.id}.mp4`;
    const videoPath = path.join(assetsDir, videoFileName);
    
    if (videoUrl.startsWith('blob:')) {
      console.log('Blob URL detected - cannot process for LMS. Using placeholder.');
      return null;
    } else if (videoUrl.startsWith('http')) {
      // Download external video
      try {
        const response = await axios.get(videoUrl, { responseType: 'stream' });
        const writer = fs.createWriteStream(videoPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
          writer.on('finish', () => {
            console.log(`External video downloaded: ${videoFileName}`);
            resolve(videoFileName);
          });
          writer.on('error', reject);
        });
      } catch (error) {
        console.error('Failed to download external video:', error);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error processing video for SCORM:', error);
    return null;
  }
}

// Helper function to generate SCORM API
function generateSCORMAPI() {
  return `
// SCORM 2004 API Implementation
var API_1484_11 = {
    Initialize: function(param) {
        console.log("SCORM Initialize called with:", param);
        return "true";
    },
    
    GetValue: function(element) {
        console.log("SCORM GetValue called for:", element);
        // Return appropriate values for valid SCORM 2004 elements
        if (element === "cmi.completion_status") {
            return "incomplete";
        }
        if (element === "cmi.success_status") {
            return "unknown";
        }
        if (element === "cmi.learner_id") {
            return "12312";
        }
        if (element === "cmi.learner_name") {
            return "Test learner";
        }
        return "";
    },
    
    SetValue: function(element, value) {
        console.log("SCORM SetValue called:", element, "=", value);
        // Only allow valid SCORM 2004 elements
        const validElements = [
            "cmi.completion_status",
            "cmi.success_status",
            "cmi.learner_id",
            "cmi.learner_name",
            "cmi.location",
            "cmi.suspend_data",
            "cmi.launch_data",
            "cmi.comments",
            "cmi.comments_from_lms",
            "cmi.objectives",
            "cmi.student_data",
            "cmi.student_preference",
            "cmi.interactions",
            "cmi.objectives",
            "cmi.student_data",
            "cmi.student_preference"
        ];
        
        if (validElements.includes(element)) {
            return "true";
        } else {
            console.error("Invalid SCORM element:", element);
            return "false";
        }
    },
    
    Commit: function(param) {
        console.log("SCORM Commit called with:", param);
        return "true";
    },
    
    Terminate: function(param) {
        console.log("SCORM Terminate called with:", param);
        return "true";
    }
};

// Make API available globally
window.API_1484_11 = API_1484_11;
`;
}

// Extract text from uploaded document
async function extractTextFromDocument(filePath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      // Use pdf-extraction for PDF parsing (Node.js compatible)
      const result = await pdfExtraction(filePath);
      return result.text || '';
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               mimeType === 'application/msword') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    return null;
  } catch (error) {
    console.error('Error extracting text from document:', error);
    throw error;
  }
}

// Generate SCORM content from document using AI
async function generateSCORMFromDocument(documentText, courseTitle) {
  try {
    console.log('🤖 Generating SCORM structure from document using AI...');
    
    const prompt = `You are an expert SCORM course designer. Analyze the following document content and generate a comprehensive SCORM course structure in JSON format.

Document Content:
${documentText.substring(0, 15000)}${documentText.length > 15000 ? '...[truncated]' : ''}

Course Title: ${courseTitle}

REQUIREMENTS:
1. Generate content blocks in the following format (return ONLY valid JSON, no markdown):
   {
     "content": [
       {
         "id": "block_1",
         "type": "welcome",
         "title": "Welcome Page",
         "data": { ... }
       },
       {
         "id": "block_2",
         "type": "text-image" | "accordion" | "checklist" | "flashcards" | "document" | "embed",
         "title": "Descriptive Slide Title",  // REQUIRED: Every block MUST have a unique, descriptive title
         "data": { ... }
       },
       ...
       {
         "id": "block_N-1",
         "type": "quiz",
         "title": "Quiz",
         "data": { ... }
       },
       {
         "id": "block_N",
         "type": "course-completed",
         "title": "Course Completed",
         "data": { ... }
       }
     ]
   }

CRITICAL: Every single block MUST have a "title" field at the block level (not just inside data). Generate descriptive, unique titles for each block based on its content. Examples:
- "Introduction to Topic Name"
- "Understanding Key Concepts"  
- "Practical Examples and Applications"
- "Summary and Review"
- "Assessment Quiz"
Make titles specific to the content, not generic like "Slide 1" or "Content Block".

2. CONTENT TYPE RULES:
   - Always start with a "welcome" block
   - Always end with a "course-completed" block
   - The SECOND-TO-LAST block MUST be a "quiz" type
   - Use "text-image" for slides with text and images
   - Use "accordion" for expandable content sections
   - Use "checklist" for step-by-step instructions
   - Use "flashcards" for key concepts and definitions
   - Use "embed" for external resources if needed

3. CONTENT LIMITS PER SLIDE:
   - Text: Maximum 500 words per slide
   - Break large sections into multiple slides
   - Each slide should focus on one main topic

4. QUIZ REQUIREMENTS:
   - Must have at least 5 questions
   - Use VARIETY in question types! Mix different types:
     * "mcq" - Multiple choice (4 options, correctAnswer is index 0-3)
     * "multiple" - Multiple response (4+ options, correctAnswer is array of indices like [0, 2])
     * "true-false" - True/False (2 options, correctAnswer is boolean: true or false)
     * "fill-blank" - Fill in the blank (sentenceParts structure)
     * "short-answer" - Short answer (correctAnswer is array of strings)
   - Each question must have: "id" (string), "type" (string from above), "question" (string), "options" (array of strings), "correctAnswer" (varies by type), "explanation" (optional string)
   - For "fill-blank": Use "sentenceParts" array with structure [{ "type": "text" | "blank", "text": string, "options": string[] }]
   - Questions should test understanding of key concepts from the document
   - IMPORTANT: Mix at least 2-3 different question types, don't use only "mcq"

5. DATA STRUCTURE FOR EACH TYPE:
   - welcome: { "title": string, "description": string, "duration": number }
   - text-image: { "title": string, "body": string, "imageUrl": string (optional) }
   - accordion: { "title": string (REQUIRED - block-level title), "description": string (REQUIRED - block-level description), "items": [{ "title": string, "content": string }] }
   - checklist: { "title": string (REQUIRED - block-level title), "items": [{ "text": string, "checked": boolean }] }
   - flashcards: { "title": string (REQUIRED - block-level title), "description": string (REQUIRED - block-level description), "cards": [{ "front": string, "back": string }] }
   - video: { "title": string (REQUIRED - block-level title), "description": string (REQUIRED - block-level description), "videoUrl": string, "enforceCompletion": boolean }
   - document: { "title": string (REQUIRED - block-level title), "description": string (REQUIRED - block-level description), "documentUrl": string, "enforceCompletion": boolean }
   - embed: { "title": string (REQUIRED - block-level title), "description": string (REQUIRED - block-level description), "url": string }
   - hotspot: { "title": string (REQUIRED - block-level title), "imageUrl": string, "altText": string, "hotspots": [] }
   - quiz: { 
       "startTitle": "Test your knowledge",
       "startContent": "Add your content here...",
       "finishTitle": "Congratulations! 😊",
       "finishMessage": "You have completed the quiz",
       "questions": [
         {
           "id": "question_1",
           "type": "mcq" | "multiple" | "true-false" | "fill-blank" | "short-answer",
           "question": string,
           "options": [string, ...] (required for mcq, multiple, true-false),
           "correctAnswer": number (for mcq) | [number, ...] (for multiple) | boolean (for true-false) | [] (for fill-blank) | [string, ...] (for short-answer),
           "sentenceParts": [{ "type": "text" | "blank", "text": string, "options": string[] }] (for fill-blank only),
           "explanation": string (optional)
         }
       ]
     }
   - course-completed: { "title": string, "subtitle": string, "selectedEmoji": "happy", "ctaText": string }

6. Organize content logically:
   - Introduction/Welcome
   - Main content (break into digestible slides)
   - Key concepts (use flashcards if helpful)
   - Summary/Review
   - Quiz (assess learning)
   - Completion

Generate a comprehensive course with at least 8-12 content blocks (not counting welcome and course-completed).`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SCORM course designer. Generate structured course content in JSON format only. Always return valid JSON that can be parsed.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('AI did not return content');
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content;
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonContent);
    
    // Ensure proper structure
    if (!parsed.content || !Array.isArray(parsed.content)) {
      throw new Error('Invalid structure returned from AI');
    }

    // Ensure quiz is second-to-last and course-completed is last
    const contentBlocks = parsed.content;
    const lastBlock = contentBlocks[contentBlocks.length - 1];
    const secondLastBlock = contentBlocks[contentBlocks.length - 2];

    // Ensure course-completed is last
    if (lastBlock.type !== 'course-completed') {
      // Remove existing course-completed if present
      const filtered = contentBlocks.filter(block => block.type !== 'course-completed');
      filtered.push({
        id: `block_${Date.now()}_completed`,
        type: 'course-completed',
        title: 'Course Completed',
        data: {
          title: "You're all done!",
          subtitle: "How was your course experience?",
          selectedEmoji: 'happy',
          ctaText: "Create your own course",
          layout: 'image-behind',
          confetti: 'celebration'
        }
      });
      parsed.content = filtered;
    }

    // Ensure quiz is second-to-last
    if (secondLastBlock && secondLastBlock.type !== 'quiz') {
      const filtered = parsed.content.filter(block => block.type !== 'quiz');
      // Add quiz before last block (course-completed)
      const lastIndex = filtered.length - 1;
      filtered.splice(lastIndex, 0, {
        id: `block_${Date.now()}_quiz`,
        type: 'quiz',
        title: 'Quiz',
        data: {
          startTitle: 'Test your knowledge',
          startContent: 'Add your content here...',
          finishTitle: 'Congratulations! 😊',
          finishMessage: 'You have completed the quiz',
          questions: [
            {
              id: `question_${Date.now()}_0`,
              type: 'mcq',
              question: 'What is the main topic of this course?',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 0,
              explanation: ''
            }
          ]
        }
      });
      parsed.content = filtered;
    }

    // Ensure every block has a title and transform to correct format
    parsed.content = parsed.content.map((block, index) => {
      // Ensure every block has a title at the block level
      if (!block.title || block.title.trim() === '') {
        // Generate title based on content or type
        let generatedTitle = '';
        
        if (block.data && block.data.title) {
          // Use title from data if available
          generatedTitle = block.data.title;
        } else {
          // Generate based on type and content
          switch (block.type) {
            case 'text-image':
              generatedTitle = block.data?.body ? 
                block.data.body.substring(0, 60).replace(/\n/g, ' ').trim().replace(/\.+$/, '') || `Content Slide ${index + 1}` :
                `Content Slide ${index + 1}`;
              break;
            case 'accordion':
              generatedTitle = block.data?.title || block.data?.items?.[0]?.title || `Accordion Section ${index + 1}`;
              // Ensure data.title and data.description exist
              if (!block.data.title && generatedTitle) {
                block.data = { ...block.data, title: generatedTitle };
              }
              if (!block.data.description) {
                block.data = { ...block.data, description: '' };
              }
              break;
            case 'checklist':
              generatedTitle = block.data?.title || block.data?.items?.[0]?.text ? 
                (block.data.items[0].text.substring(0, 60) + (block.data.items[0].text.length > 60 ? '...' : '')) :
                `Checklist ${index + 1}`;
              // Ensure data.title exists
              if (!block.data.title && generatedTitle) {
                block.data = { ...block.data, title: generatedTitle };
              }
              break;
            case 'flashcards':
              generatedTitle = block.data?.title || block.data?.cards?.[0]?.front ? 
                (block.data.cards[0].front.substring(0, 60) + (block.data.cards[0].front.length > 60 ? '...' : '')) :
                `Flashcards ${index + 1}`;
              // Ensure data.title and data.description exist
              if (!block.data.title && generatedTitle) {
                block.data = { ...block.data, title: generatedTitle };
              }
              if (!block.data.description) {
                block.data = { ...block.data, description: '' };
              }
              break;
            case 'video':
              generatedTitle = block.data?.title || block.data?.description?.substring(0, 60) || `Video Content ${index + 1}`;
              // Ensure data.title and data.description exist
              if (!block.data.title && generatedTitle) {
                block.data = { ...block.data, title: generatedTitle };
              }
              if (!block.data.description) {
                block.data = { ...block.data, description: '' };
              }
              break;
            case 'document':
              generatedTitle = block.data?.title || block.data?.description?.substring(0, 60) || `Document ${index + 1}`;
              // Ensure data.title and data.description exist
              if (!block.data.title && generatedTitle) {
                block.data = { ...block.data, title: generatedTitle };
              }
              if (!block.data.description) {
                block.data = { ...block.data, description: '' };
              }
              break;
            case 'embed':
              generatedTitle = block.data?.title || block.data?.description?.substring(0, 60) || `Embedded Content ${index + 1}`;
              // Ensure data.title and data.description exist
              if (!block.data.title && generatedTitle) {
                block.data = { ...block.data, title: generatedTitle };
              }
              if (!block.data.description) {
                block.data = { ...block.data, description: '' };
              }
              break;
            case 'welcome':
              generatedTitle = 'Welcome Page';
              break;
            case 'quiz':
              generatedTitle = 'Quiz';
              break;
            case 'course-completed':
              generatedTitle = 'Course Completed';
              break;
            default:
              generatedTitle = `${block.type.charAt(0).toUpperCase() + block.type.slice(1).replace('-', ' ')} ${index + 1}`;
          }
        }
        
        block.title = generatedTitle;
      }
      
      // Ensure accordion has title and description at block level
      if (block.type === 'accordion' && block.data) {
        if (!block.data.title) {
          block.data.title = block.title || 'Untitled';
        }
        if (!block.data.description) {
          block.data.description = '';
        }
      }
      
      // Ensure accordion items have IDs
      if (block.type === 'accordion' && block.data && block.data.items && Array.isArray(block.data.items)) {
        block.data.items = block.data.items.map((item, itemIndex) => ({
          id: item.id || `accordion_item_${Date.now()}_${itemIndex}`,
          title: item.title || '',
          description: item.description || item.content || '',
          content: item.content || item.description || '',
          isExpanded: item.isExpanded || false
        }));
      }
      
      // Ensure checklist has title at block level
      if (block.type === 'checklist' && block.data) {
        if (!block.data.title) {
          block.data.title = block.title || 'Untitled';
        }
      }
      
      // Ensure checklist items have IDs
      if (block.type === 'checklist' && block.data && block.data.items && Array.isArray(block.data.items)) {
        const addIdsToItems = (items, parentId) => {
          return items.map((item, itemIndex) => ({
            id: item.id || `checklist_item_${Date.now()}_${itemIndex}`,
            text: item.text || '',
            checked: item.checked !== undefined ? item.checked : true,
            children: item.children && Array.isArray(item.children) ? addIdsToItems(item.children, item.id) : undefined
          }));
        };
        block.data.items = addIdsToItems(block.data.items);
      }
      
      // Ensure flashcards have title and description at block level
      if (block.type === 'flashcards' && block.data) {
        if (!block.data.title) {
          block.data.title = block.title || 'Untitled';
        }
        if (!block.data.description) {
          block.data.description = '';
        }
      }
      
      // Ensure flashcard items have IDs
      if (block.type === 'flashcards' && block.data && block.data.cards && Array.isArray(block.data.cards)) {
        block.data.cards = block.data.cards.map((card, cardIndex) => ({
          id: card.id || `flashcard_${Date.now()}_${cardIndex}`,
          front: card.front || card.frontTitle || '',
          frontTitle: card.frontTitle || card.front || '',
          frontDescription: card.frontDescription || '',
          back: card.back || '',
          image: card.image || ''
        }));
      }
      
      // Ensure video, document, embed, hotspot have title and description at block level
      if ((block.type === 'video' || block.type === 'document' || block.type === 'embed' || block.type === 'hotspot') && block.data) {
        if (!block.data.title) {
          block.data.title = block.title || 'Untitled';
        }
        if ((block.type === 'video' || block.type === 'document' || block.type === 'embed') && !block.data.description) {
          block.data.description = '';
        }
      }
      
      // Transform quiz blocks to ensure correct format
      if (block.type === 'quiz' && block.data && block.data.questions) {
        // Transform quiz questions to expected format
        const transformedQuestions = block.data.questions.map((q, qIndex) => {
          // If options are in old format [{text, isCorrect}], transform them
          if (q.options && Array.isArray(q.options) && q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0].text) {
            const optionsArray = q.options.map(opt => opt.text || opt);
            const correctIndex = q.options.findIndex(opt => opt.isCorrect === true);
            
            return {
              id: q.id || `question_${Date.now()}_${qIndex}`,
              type: q.type || 'mcq',
              question: q.question || '',
              options: optionsArray,
              correctAnswer: correctIndex >= 0 ? correctIndex : (q.correctAnswer !== undefined ? q.correctAnswer : 0),
              explanation: q.explanation || '',
              sentenceParts: q.sentenceParts,
              matchPairs: q.matchPairs,
              sequenceItems: q.sequenceItems
            };
          }
          
          // Ensure required fields are present based on question type
          const questionType = q.type || 'mcq';
          let correctAnswer = q.correctAnswer;
          
          // Set defaults based on question type
          if (questionType === 'mcq') {
            correctAnswer = q.correctAnswer !== undefined ? q.correctAnswer : 0;
          } else if (questionType === 'multiple') {
            correctAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer : (q.correctAnswer !== undefined ? [q.correctAnswer] : [0]);
          } else if (questionType === 'true-false') {
            correctAnswer = typeof q.correctAnswer === 'boolean' ? q.correctAnswer : true;
          } else if (questionType === 'short-answer') {
            correctAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer : (q.correctAnswer ? [String(q.correctAnswer)] : ['']);
          } else if (questionType === 'fill-blank') {
            correctAnswer = q.correctAnswer || [];
          }
          
          return {
            id: q.id || `question_${Date.now()}_${qIndex}`,
            type: questionType,
            question: q.question || '',
            options: Array.isArray(q.options) ? q.options : (questionType === 'true-false' ? ['True', 'False'] : []),
            correctAnswer: correctAnswer,
            explanation: q.explanation || '',
            sentenceParts: q.sentenceParts || (questionType === 'fill-blank' ? [
              { type: 'text', text: 'The capital of France is' },
              { type: 'blank', options: ['Paris', 'London', 'Berlin'], selectedAnswer: '' }
            ] : undefined),
            matchPairs: q.matchPairs,
            sequenceItems: q.sequenceItems
          };
        });
        
        // Ensure quiz has required top-level fields
        block.data = {
          startTitle: block.data.startTitle || 'Test your knowledge',
          startContent: block.data.startContent || 'Add your content here...',
          finishTitle: block.data.finishTitle || 'Congratulations! 😊',
          finishMessage: block.data.finishMessage || 'You have completed the quiz',
          questions: transformedQuestions,
          ...block.data
        };
      }
      
      return {
        ...block,
        order: index + 1
      };
    });

    console.log(`✅ Generated ${parsed.content.length} content blocks`);
    return parsed.content;
  } catch (error) {
    console.error('Error generating SCORM from document:', error);
    throw error;
  }
}

// Generate SCORM from document upload
const generateSCORMFromDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title } = req.body;
    if (!title || title.trim() === '') {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Course title is required' });
    }

    console.log(`📄 Processing document: ${req.file.originalname}`);
    console.log(`📝 Course Title: ${title}`);

    // Extract text from document
    const documentText = await extractTextFromDocument(req.file.path, req.file.mimetype);
    
    if (!documentText || documentText.trim() === '') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Could not extract text from document. Please ensure the file is not empty or corrupted.' });
    }

    console.log(`✅ Extracted ${documentText.length} characters from document`);

    // Generate SCORM structure using AI
    const contentBlocks = await generateSCORMFromDocument(documentText, title);

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.warn('Failed to delete temp file:', err);
    }

    // Return the generated content in the same format as MongoDB storage
    res.json({
      message: 'SCORM structure generated successfully',
      title: title.trim(),
      description: 'Generated from uploaded document',
      content: contentBlocks,
      contentBlocks: contentBlocks.length
    });

  } catch (error) {
    console.error('Generate SCORM from document error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn('Failed to delete temp file:', err);
      }
    }

    res.status(500).json({ 
      message: 'Server error while generating SCORM from document',
      error: error.message 
    });
  }
};

module.exports = {
  getAllSCORMs,
  getSCORM,
  createSCORM,
  updateSCORM,
  deleteSCORM,
  publishSCORM,
  generateSCORM,
  generateSCORMFromDoc,
  upload, // Export multer middleware
  fetchTextContent,
  generateTTSAudio
};