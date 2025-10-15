module.exports = {
  // Video optimization settings
  video: {
    maxWidth: 1280,
    maxHeight: 720,
    maxBitrate: '2M',
    bufferSize: '4M',
    quality: 28, // CRF value (lower = better quality, higher = smaller file)
    preset: 'fast'
  },
  
  // Temporary directory for video processing
  tempDir: process.env.VIDEO_TEMP_DIR || 'temp/videos'
};
