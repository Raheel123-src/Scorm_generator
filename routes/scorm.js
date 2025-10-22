const express = require('express');
const SCORMPackage = require('../models/SCORMPackage');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');
const FormData = require('form-data');
const videoService = require('../services/videoService');
const documentService = require('../services/documentService');

const router = express.Router();

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
router.get('/', async (req, res) => {
  try {
    const packages = await SCORMPackage.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .select('title description createdAt updatedAt isPublished');

    res.json({
      packages: packages.map(pkg => ({
        id: pkg._id,
        title: pkg.title,
        description: pkg.description,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
        isPublished: pkg.isPublished,
        contentBlocks: pkg.content.length
      }))
    });
  } catch (error) {
    console.error('Get SCORM packages error:', error);
    res.status(500).json({ message: 'Server error while fetching SCORM packages' });
  }
});

// Get a specific SCORM package
router.get('/:id', async (req, res) => {
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
      content: scormPackage.content,
      isPublished: scormPackage.isPublished,
      createdAt: scormPackage.createdAt,
      updatedAt: scormPackage.updatedAt
    });
  } catch (error) {
    console.error('Get SCORM package error:', error);
    res.status(500).json({ message: 'Server error while fetching SCORM package' });
  }
});

// Create a new SCORM package
router.post('/', async (req, res) => {
  try {
    const { title, description, content = [] } = req.body;

    console.log('Creating SCORM package:', { title, contentLength: content.length, userId: req.user.userId });

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    // Process content to remove large video and document data URLs to avoid MongoDB BSON size limits
    const processedContent = content.map(block => {
      if (block.type === 'video' && block.data && block.data.videoUrl && block.data.videoUrl.startsWith('data:')) {
        // Store only video metadata, not the actual video data
        return {
          ...block,
          data: {
            ...block.data,
            // Remove the large data URL, it will be processed during SCORM generation
            videoUrl: 'data:video/mp4;base64,[PROCESSED_DURING_GENERATION]',
            hasVideoData: true // Flag to indicate this block has video data to process
          }
        };
      } else if (block.type === 'document' && block.data && block.data.documentUrl && block.data.documentUrl.startsWith('data:')) {
        // Store only document metadata, not the actual document data
        return {
          ...block,
          data: {
            ...block.data,
            // Remove the large data URL, it will be processed during SCORM generation
            documentUrl: 'data:application/pdf;base64,[PROCESSED_DURING_GENERATION]',
            hasDocumentData: true // Flag to indicate this block has document data to process
          }
        };
      }
      return block;
    });

    const scormPackage = new SCORMPackage({
      title,
      description,
      userId: req.user.userId,
      content: processedContent
    });

    await scormPackage.save();

    console.log('SCORM package created successfully:', scormPackage._id);

    res.status(201).json({
      message: 'SCORM package created successfully',
      id: scormPackage._id,
      title: scormPackage.title,
      description: scormPackage.description,
      content: scormPackage.content,
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
});

// Update a SCORM package
router.put('/:id', async (req, res) => {
  try {
    const packageId = req.params.id;
    const { title, description, content } = req.body;

    const scormPackage = await SCORMPackage.findOneAndUpdate(
      { _id: packageId, userId: req.user.userId },
      { 
        title, 
        description, 
        content,
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
      content: scormPackage.content,
      updatedAt: scormPackage.updatedAt
    });
  } catch (error) {
    console.error('Update SCORM package error:', error);
    res.status(500).json({ message: 'Server error while updating SCORM package' });
  }
});

// Delete a SCORM package
router.delete('/:id', async (req, res) => {
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
});

// Publish a SCORM package
router.post('/:id/publish', async (req, res) => {
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
});

// Generate TTS audio for slide content
async function generateTTSAudio(content, slideIndex, totalSlides, previousContent = '') {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      console.warn('OpenAI API key not configured. Skipping TTS generation.');
      return null;
    }

    const prompt = `You are an AI voice assistant creating audio summaries for educational content. 

Previous slide context: ${previousContent}

Current slide content: ${content}

Create a concise, engaging audio summary (2-3 minutes max) that:
1. Connects to previous content if applicable
2. Explains the current slide content clearly
3. Maintains educational flow
4. Uses a conversational, engaging tone
5. Highlights key points and learning objectives

Keep it educational but accessible.`;

    console.log(`Generating TTS audio for slide ${slideIndex + 1}...`);

    const response = await axios.post('https://api.openai.com/v1/audio/speech', {
      model: 'tts-1',
      input: prompt,
      voice: 'alloy',
      response_format: 'mp3'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

    console.log(`TTS audio generated successfully for slide ${slideIndex + 1}`);
    return response.data;
  } catch (error) {
    console.error('TTS generation error:', error.response?.data || error.message);
    return null;
  }
}

// Generate SCORM package with TTS audio
router.post('/:id/generate', async (req, res) => {
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
      if (block.type === 'document' && block.data.hasDocumentData) {
        // Use the original document data from the request
        const originalDocumentUrl = documentData[block.id];
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
      
      if (block.type === 'video' && block.data.hasVideoData) {
        // Use the original video data from the request
        const originalVideoUrl = videoData[block.id];
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

    // Create ZIP package
    const output = fs.createWriteStream(path.join(tempDir, 'scorm_package.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(tempDir, false);
    await archive.finalize();

    // Log generation summary
    console.log(`SCORM package generated successfully:`);
    console.log(`- Title: ${scormPackage.title}`);
    console.log(`- Slides: ${scormPackage.content.length}`);
    console.log(`- TTS Audio: ${includeTTS ? (audioFiles.length > 0 ? `${audioFiles.length} files` : 'Failed to generate') : 'Disabled'}`);
    console.log(`- Package size: ${fs.statSync(path.join(tempDir, 'scorm_package.zip')).size} bytes`);

    // Send the ZIP file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${scormPackage.title.replace(/[^a-zA-Z0-9]/g, '_')}.zip"`);
    
    const zipStream = fs.createReadStream(path.join(tempDir, 'scorm_package.zip'));
    zipStream.pipe(res);

    // Cleanup after sending
    zipStream.on('end', () => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

  } catch (error) {
    console.error('Generate SCORM package error:', error);
    res.status(500).json({ message: 'Server error while generating SCORM package' });
  }
});

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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
                overlay.innerHTML = \`
                    <div class="hotspot-info-card">
                        <div class="hotspot-info-header">
                            <h3 class="hotspot-info-title">\${hotspot.title || 'Hotspot'}</h3>
                            <button class="hotspot-info-close" onclick="closeHotspotInfo()">×</button>
                        </div>
                        <div class="hotspot-info-content">
                            <p class="hotspot-info-description">\${hotspot.description || 'No description available'}</p>
                        </div>
                    </div>
                \`;
                
                // Append to image wrapper instead of body
                const imageWrapper = document.querySelector('.image-wrapper');
                if (imageWrapper) {
                    imageWrapper.appendChild(overlay);
                    
                    // Position the card relative to the hotspot within the image
                    const hotspotElement = document.querySelector(\`[onclick="showHotspotInfo(\${hotspotIndex})"]\`);
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
  
  const imageHtml = block.data.image ? `<img src="${block.data.image}" alt="${block.data.altText || ''}" class="content-image">` : '';
  
  // Handle different layout types
  let layoutClass = `layout-${layout}`;
  let backgroundStyle = '';
  
  if (layout === 'behind' && block.data.image) {
    backgroundStyle = `style="background-image: url('${block.data.image}'); background-size: cover; background-position: center; background-repeat: no-repeat;"`;
  }
  
  return `
    <div class="text-image-slide ${layoutClass}" ${backgroundStyle}>
      <div class="text-section ${layout === 'behind' ? 'layout-behind' : ''}">
        <h1 class="content-title">${block.data.title || 'Untitled'}</h1>
        <div class="content-body">${block.data.content || ''}</div>
      </div>
      ${layout !== 'none' && layout !== 'behind' ? `<div class="image-section">${imageHtml}</div>` : ''}
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
  const itemsHtml = block.data.items.map((item, index) => `
    <div class="checklist-item">
      <input type="checkbox" id="item_${index}" onchange="updateProgress()">
      <label for="item_${index}">${item.text}</label>
    </div>
  `).join('');
  
  return `
    <div class="checklist-slide">
      <h1 class="checklist-title">${block.data.title || 'Checklist'}</h1>
      <div class="checklist-container">
        ${itemsHtml}
      </div>
    </div>
  `;
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
    .welcome-slide { position: relative; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%); color: white; display: flex; align-items: center; justify-content: center; }
    .welcome-gradient { position: absolute; top: -50%; right: -20%; width: 60%; height: 200%; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%); border-radius: 50%; opacity: 0.3; transform: rotate(-15deg); }
    .welcome-content { text-align: center; z-index: 10; position: relative; max-width: 600px; padding: 2rem; }
    .welcome-title { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; }
    .welcome-duration { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 2rem; color: #cbd5e1; }
    .welcome-description { font-size: 1.2rem; margin-bottom: 2rem; }
    .welcome-start-btn { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 1rem 2rem; border-radius: 2rem; border: none; font-size: 1.125rem; font-weight: 600; cursor: pointer; }
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
    case 'course-completed':
      content = `${block.data.title || 'Course Completed'}. ${block.data.subtitle || ''}`;
      break;
    default:
      content = block.title || 'Content';
  }
  
  return content;
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

module.exports = router;