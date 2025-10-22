const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'scorm-documents';

class DocumentService {
  constructor() {
    this.tempDir = path.join(__dirname, '..', 'temp', 'documents');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Process and upload document to S3 with enhanced support
   * @param {string} documentDataUrl - Base64 data URL of the document
   * @param {string} blockId - Unique identifier for the document block
   * @param {string} fileType - MIME type of the document
   * @param {string} docxContent - Parsed HTML content from frontend (for DOCX files)
   * @returns {Promise<Object>} - Object containing S3 URL and processing info
   */
  async processAndUploadDocument(documentDataUrl, blockId, fileType, docxContent = null) {
    try {
      console.log(`📄 Processing document for block ${blockId}`);
      console.log(`📄 File type: ${fileType}`);
      console.log(`📄 Has docxContent: ${!!docxContent}`);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString('hex');
      const fileExtension = this.getFileExtension(fileType);
      const fileName = `document_${blockId}_${timestamp}_${randomId}.${fileExtension}`;
      
      // Create temporary file path
      const tempInputPath = path.join(this.tempDir, `input_${fileName}`);
      
      // Convert base64 to file
      await this.convertBase64ToFile(documentDataUrl, tempInputPath);
      
      // Verify file was created
      const stats = fs.statSync(tempInputPath);
      console.log(`📄 Document file created: ${tempInputPath}`);
      console.log(`📄 File size: ${stats.size} bytes`);
      
      // Upload to S3 with correct content type and headers
      const s3Url = await this.uploadToS3(tempInputPath, fileName, fileType);
      
      // Cleanup temporary files
      this.cleanupTempFiles([tempInputPath]);
      
      const result = {
        s3Url,
        fileName,
        fileType,
        fileSize: stats.size,
        processed: true
      };

      // Add DOCX content if available
      if (docxContent && fileType.includes('word')) {
        result.docxContent = docxContent;
        result.hasParsedContent = true;
      }
      
      console.log(`✅ Document processed and uploaded: ${s3Url}`);
      return result;
      
    } catch (error) {
      console.error('❌ Error processing document:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  /**
   * Get file extension from MIME type
   */
  getFileExtension(fileType) {
    const extensions = {
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'text/rtf': 'rtf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/vnd.ms-powerpoint': 'ppt'
    };
    return extensions[fileType] || 'bin';
  }

  /**
   * Get proper content type and headers for document upload
   */
  getDocumentHeaders(fileType) {
    const contentTypeMap = {
      'application/pdf': {
        contentType: 'application/pdf',
        contentDisposition: 'inline; filename="document.pdf"',
        cacheControl: 'public, max-age=31536000',
        additionalHeaders: {
          'X-Content-Type-Options': 'nosniff'
        }
      },
      'text/plain': {
        contentType: 'text/plain; charset=utf-8',
        contentDisposition: 'inline; filename="document.txt"',
        cacheControl: 'public, max-age=31536000',
        additionalHeaders: {
          'X-Content-Type-Options': 'nosniff'
        }
      },
      'text/rtf': {
        contentType: 'text/rtf',
        contentDisposition: 'inline; filename="document.rtf"',
        cacheControl: 'public, max-age=31536000',
        additionalHeaders: {
          'X-Content-Type-Options': 'nosniff'
        }
      },
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        contentDisposition: 'attachment; filename="document.docx"',
        cacheControl: 'public, max-age=31536000',
        additionalHeaders: {
          'X-Content-Type-Options': 'nosniff'
        }
      },
      'application/msword': {
        contentType: 'application/msword',
        contentDisposition: 'attachment; filename="document.doc"',
        cacheControl: 'public, max-age=31536000',
        additionalHeaders: {
          'X-Content-Type-Options': 'nosniff'
        }
      },
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        contentDisposition: 'attachment; filename="document.pptx"',
        cacheControl: 'public, max-age=31536000',
        additionalHeaders: {
          'X-Content-Type-Options': 'nosniff'
        }
      },
      'application/vnd.ms-powerpoint': {
        contentType: 'application/vnd.ms-powerpoint',
        contentDisposition: 'attachment; filename="document.ppt"',
        cacheControl: 'public, max-age=31536000',
        additionalHeaders: {
          'X-Content-Type-Options': 'nosniff'
        }
      }
    };

    return contentTypeMap[fileType] || {
      contentType: 'application/octet-stream',
      contentDisposition: 'attachment',
      cacheControl: 'public, max-age=31536000',
      additionalHeaders: {
        'X-Content-Type-Options': 'nosniff'
      }
    };
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
   * Upload file to S3 with proper content type and headers
   */
  async uploadToS3(filePath, fileName, fileType) {
    try {
      const fileStream = fs.createReadStream(filePath);
      const headers = this.getDocumentHeaders(fileType);
      
      console.log(`📄 Uploading document with headers:`, {
        contentType: headers.contentType,
        contentDisposition: headers.contentDisposition,
        cacheControl: headers.cacheControl,
        additionalHeaders: headers.additionalHeaders
      });
      
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: `documents/${fileName}`,
          Body: fileStream,
          ContentType: headers.contentType,
          CacheControl: headers.cacheControl,
          ContentDisposition: headers.contentDisposition,
          Metadata: {
            'original-file-type': fileType,
            'upload-timestamp': new Date().toISOString(),
            'scorm-document': 'true'
          },
          ...headers.additionalHeaders
        }
      });

      const result = await upload.done();
      const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/documents/${fileName}`;
      
      console.log(`✅ File uploaded to S3: ${s3Url}`);
      console.log(`📋 Headers applied:`, {
        'Content-Type': headers.contentType,
        'Content-Disposition': headers.contentDisposition,
        'Cache-Control': headers.cacheControl,
        'X-Content-Type-Options': headers.additionalHeaders['X-Content-Type-Options'],
        'X-Frame-Options': headers.additionalHeaders['X-Frame-Options'] || 'Not set'
      });
      
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
          console.log(`🧹 Cleaned up: ${filePath}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to cleanup ${filePath}:`, error.message);
      }
    });
  }

  /**
   * Generate enhanced document HTML for SCORM
   */
  generateDocumentHTML(block, documentInfo) {
    const { s3Url, fileType, fileName, docxContent } = documentInfo;
    
    // Handle different document types
    if (fileType === 'application/pdf') {
      return this.generatePDFViewerHTML(block, s3Url, fileName);
    } else if (fileType === 'text/plain' || fileType === 'text/rtf') {
      return this.generateTextDocumentHTML(block, s3Url, fileName);
    } else if (fileType.includes('word') && docxContent) {
      return this.generateDOCXViewerHTML(block, s3Url, fileName, docxContent);
    } else {
      return this.generateDownloadHTML(block, s3Url, fileName, fileType);
    }
  }

  /**
   * Generate PDF viewer HTML
   */
  generatePDFViewerHTML(block, s3Url, fileName) {
    return `
      <div class="pdf-viewer-container">
        <div class="pdf-header">
          <h3>📄 ${fileName}</h3>
          <div class="pdf-controls">
            <button onclick="toggleFullscreen()" class="pdf-control-btn">Fullscreen</button>
            <a href="${s3Url}" target="_blank" class="pdf-control-btn">Open in New Tab</a>
            <a href="${s3Url}" download class="pdf-control-btn">Download</a>
          </div>
        </div>
        <div class="pdf-viewer-wrapper">
          <iframe 
            src="${s3Url}#toolbar=1&navpanes=1&scrollbar=1" 
            class="pdf-iframe"
            title="PDF Document"
            onload="handlePDFLoad()"
            onerror="handlePDFError()"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
          ></iframe>
        </div>
        <div class="pdf-fallback" id="pdfFallback" style="display: none;">
          <div class="pdf-fallback-content">
            <h4>PDF couldn't be displayed inline</h4>
            <p>This might be due to browser security settings or the PDF format.</p>
            <div class="pdf-actions">
              <a href="${s3Url}" target="_blank" class="download-btn primary">View PDF in New Tab</a>
              <a href="${s3Url}" download class="download-btn secondary">Download PDF</a>
            </div>
            <div class="pdf-info">
              <small>💡 Tip: If the PDF doesn't open, try right-clicking and "Save link as..." to download it first.</small>
              <br><small>🔧 If blocked by Chrome: Disable ad blockers or try incognito mode.</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate text document HTML
   */
  generateTextDocumentHTML(block, s3Url, fileName) {
    return `
      <div class="text-document-preview">
        <h3>📄 ${fileName}</h3>
        <div class="text-content">
          <div class="text-loading">Loading document content...</div>
        </div>
        <div class="text-actions">
          <a href="${s3Url}" target="_blank" class="download-btn primary">View Original in New Tab</a>
          <a href="${s3Url}" download class="download-btn secondary">Download Text File</a>
        </div>
      </div>
    `;
  }

  /**
   * Generate DOCX viewer HTML with parsed content
   */
  generateDOCXViewerHTML(block, s3Url, fileName, docxContent) {
    return `
      <div class="docx-viewer-container">
        <div class="docx-header">
          <h3>📄 ${fileName}</h3>
          <div class="docx-controls">
            <a href="${s3Url}" target="_blank" class="download-btn primary">View Original in Word</a>
            <a href="${s3Url}" download class="download-btn secondary">Download DOCX</a>
          </div>
        </div>
        <div class="docx-content">
          <div class="docx-html-content">
            ${docxContent}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate download-only HTML for unsupported formats
   */
  generateDownloadHTML(block, s3Url, fileName, fileType) {
    return `
      <div class="document-download-preview">
        <div class="document-info">
          <div class="document-key-badge">
            ${this.getDocumentTypeBadge(fileType)}
          </div>
          <div class="document-filename">${fileName}</div>
          <div class="document-actions">
            <a href="${s3Url}" download="${fileName}" class="download-btn primary">
              Download Document
            </a>
          </div>
        </div>
        <div class="document-preview-note">
          <p>📄 Document uploaded successfully</p>
          <p>Click download to view the full document</p>
          <p className="preview-hint">💡 Tip: Open with appropriate application for full editing</p>
        </div>
      </div>
    `;
  }

  /**
   * Get document type badge
   */
  getDocumentTypeBadge(fileType) {
    if (fileType.includes('word')) return 'WORD DOCUMENT';
    if (fileType.includes('presentation')) return 'PRESENTATION';
    if (fileType.includes('spreadsheet')) return 'SPREADSHEET';
    return 'DOCUMENT';
  }
}

module.exports = new DocumentService();
