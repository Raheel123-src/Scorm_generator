const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/videoConfig');

// Configure AWS S3 Client v3 - read credentials from environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'scorm-videos';

class VideoService {
  constructor() {
    this.tempDir = path.join(__dirname, '..', config.tempDir);
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Process and upload video to S3
   * @param {string} videoDataUrl - Base64 data URL of the video
   * @param {string} blockId - Unique identifier for the video block
   * @returns {Promise<string>} - S3 URL of the uploaded video
   */
  async processAndUploadVideo(videoDataUrl, blockId) {
    try {
      console.log(`Processing video for block ${blockId}`);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString('hex');
      const fileName = `video_${blockId}_${timestamp}_${randomId}.mp4`;
      
      // Create temporary file paths
      const tempInputPath = path.join(this.tempDir, `input_${fileName}`);
      const tempOutputPath = path.join(this.tempDir, `optimized_${fileName}`);
      
      // Convert base64 to file
      await this.convertBase64ToFile(videoDataUrl, tempInputPath);
      
      // Optimize video
      await this.optimizeVideo(tempInputPath, tempOutputPath);
      
      // Upload to S3
      const s3Url = await this.uploadToS3(tempOutputPath, fileName);
      
      // Cleanup temporary files
      this.cleanupTempFiles([tempInputPath, tempOutputPath]);
      
      console.log(`Video processed and uploaded: ${s3Url}`);
      return s3Url;
      
    } catch (error) {
      console.error('Error processing video:', error);
      throw new Error(`Failed to process video: ${error.message}`);
    }
  }

  /**
   * Convert base64 data URL to file
   */
  async convertBase64ToFile(dataUrl, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const base64Data = dataUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Use streaming for large files
        const writeStream = fs.createWriteStream(outputPath);
        const chunkSize = 1024 * 1024; // 1MB chunks
        let offset = 0;
        
        const writeChunk = () => {
          if (offset >= buffer.length) {
            writeStream.end();
            return;
          }
          
          const chunk = buffer.slice(offset, offset + chunkSize);
          writeStream.write(chunk);
          offset += chunkSize;
          
          // Use setImmediate to prevent blocking
          setImmediate(writeChunk);
        };
        
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
        
        writeChunk();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Optimize video using FFmpeg
   */
  async optimizeVideo(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          `-preset ${config.video.preset}`,           // Encoding preset
          `-crf ${config.video.quality}`,            // Quality setting
          `-maxrate ${config.video.maxBitrate}`,     // Max bitrate
          `-bufsize ${config.video.bufferSize}`,     // Buffer size
          '-movflags +faststart',                    // Web optimization
          '-profile:v baseline',                     // Better compatibility
          '-level 3.0'                               // H.264 level
        ])
        .size(`${config.video.maxWidth}x${config.video.maxHeight}`) // Max resolution
        .on('start', (commandLine) => {
          console.log('FFmpeg processing started:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', () => {
          console.log('Video optimization completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * Upload file to S3 using AWS SDK v3
   */
  async uploadToS3(filePath, fileName, contentType = 'video/mp4') {
    try {
      const fileStream = fs.createReadStream(filePath);
      
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: `videos/${fileName}`,
          Body: fileStream,
          ContentType: contentType,
          CacheControl: 'max-age=31536000' // Cache for 1 year
        }
      });

      const result = await upload.done();
      const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/videos/${fileName}`;
      
      console.log(`File uploaded to S3: ${s3Url} (Content-Type: ${contentType})`);
      return s3Url;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
  }

  /**
   * Clean up temporary files
   */
  cleanupTempFiles(filePaths) {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up: ${filePath}`);
        }
      } catch (error) {
        console.warn(`Failed to cleanup ${filePath}:`, error.message);
      }
    });
  }

  /**
   * Delete video from S3 using AWS SDK v3
   */
  async deleteVideo(s3Url) {
    try {
      const key = this.extractS3Key(s3Url);
      if (!key) return;

      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });

      await s3Client.send(command);
      console.log(`Video deleted from S3: ${s3Url}`);
    } catch (error) {
      console.error('Error deleting video from S3:', error);
    }
  }

  /**
   * Process and upload document to S3
   * @param {string} documentDataUrl - Base64 data URL of the document
   * @param {string} blockId - Unique identifier for the document block
   * @param {string} fileType - MIME type of the document
   * @returns {Promise<string>} - S3 URL of the uploaded document
   */
  async processAndUploadDocument(documentDataUrl, blockId, fileType) {
    try {
      console.log(`Processing document for block ${blockId}`);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString('hex');
      const fileExtension = fileType === 'application/pdf' ? 'pdf' : 'txt';
      const fileName = `document_${blockId}_${timestamp}_${randomId}.${fileExtension}`;
      
      // Create temporary file paths
      const tempInputPath = path.join(this.tempDir, `input_${fileName}`);
      
      // Convert base64 to file
      await this.convertBase64ToFile(documentDataUrl, tempInputPath);
      
      // Verify file was created and get its size
      const stats = fs.statSync(tempInputPath);
      console.log(`📄 Document file created: ${tempInputPath}`);
      console.log(`📄 File size: ${stats.size} bytes`);
      console.log(`📄 Content type: ${fileType}`);
      
      // Upload to S3 with correct content type
      const s3Url = await this.uploadToS3(tempInputPath, fileName, fileType);
      
      // Cleanup temporary files
      this.cleanupTempFiles([tempInputPath]);
      
      console.log(`Document processed and uploaded: ${s3Url}`);
      return s3Url;
      
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  /**
   * Extract S3 key from URL
   */
  extractS3Key(s3Url) {
    try {
      const url = new URL(s3Url);
      return url.pathname.substring(1); // Remove leading slash
    } catch (error) {
      return null;
    }
  }
}

module.exports = new VideoService();
