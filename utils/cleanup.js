const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Cleanup utility for temporary SCORM directories
 * This helps prevent disk space issues and orphaned files
 */
class CleanupService {
  constructor() {
    // Use system temp directory for better scalability
    this.tempBaseDir = path.join(os.tmpdir(), 'scorm-generator');
    this.projectTempDir = path.join(__dirname, '..', 'temp');
    this.maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
  }

  /**
   * Clean up old temporary directories
   * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
   */
  async cleanupOldDirs(maxAge = this.maxAge) {
    const now = Date.now();
    let cleanedCount = 0;
    let totalSizeFreed = 0;

    // Clean system temp directory
    if (fs.existsSync(this.tempBaseDir)) {
      const stats = await this.cleanupDirectory(this.tempBaseDir, now, maxAge);
      cleanedCount += stats.count;
      totalSizeFreed += stats.size;
    }

    // Clean project temp directory (backward compatibility)
    if (fs.existsSync(this.projectTempDir)) {
      const stats = await this.cleanupDirectory(this.projectTempDir, now, maxAge);
      cleanedCount += stats.count;
      totalSizeFreed += stats.size;
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old temp directories (${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB freed)`);
    }

    return { cleanedCount, totalSizeFreed };
  }

  /**
   * Clean up a specific directory
   */
  async cleanupDirectory(dirPath, now, maxAge) {
    let cleanedCount = 0;
    let totalSizeFreed = 0;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        try {
          const stats = fs.statSync(entryPath);
          const age = now - stats.mtimeMs;

          // Clean up old directories and files
          if (age > maxAge) {
            const size = this.getDirectorySize(entryPath);
            fs.rmSync(entryPath, { recursive: true, force: true });
            cleanedCount++;
            totalSizeFreed += size;
            console.log(`🗑️  Removed old temp: ${entry.name} (${(age / 1000 / 60).toFixed(1)} minutes old, ${(size / 1024 / 1024).toFixed(2)} MB)`);
          }
        } catch (err) {
          // Skip files/directories that can't be accessed
          console.warn(`⚠️  Could not process ${entry.name}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`Error cleaning directory ${dirPath}:`, err.message);
    }

    return { count: cleanedCount, size: totalSizeFreed };
  }

  /**
   * Get total size of a directory recursively
   */
  getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const stats = fs.statSync(dirPath);
      
      if (stats.isFile()) {
        return stats.size;
      }

      if (stats.isDirectory()) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry.name);
          totalSize += this.getDirectorySize(entryPath);
        }
      }
    } catch (err) {
      // Ignore errors for individual files
    }

    return totalSize;
  }

  /**
   * Get temp directory path (uses system temp for better scalability)
   */
  getTempDir(subdir = '') {
    if (subdir) {
      const fullPath = path.join(this.tempBaseDir, subdir);
      fs.mkdirSync(fullPath, { recursive: true });
      return fullPath;
    }
    return this.tempBaseDir;
  }

  /**
   * Start periodic cleanup job
   * @param {number} intervalMinutes - Cleanup interval in minutes (default: 30)
   */
  startPeriodicCleanup(intervalMinutes = 30) {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Run immediately on start
    this.cleanupOldDirs().catch(err => {
      console.error('Error in initial cleanup:', err);
    });

    // Then run periodically
    setInterval(() => {
      this.cleanupOldDirs().catch(err => {
        console.error('Error in periodic cleanup:', err);
      });
    }, intervalMs);

    console.log(`🔄 Started periodic cleanup job (every ${intervalMinutes} minutes)`);
  }
}

// Create singleton instance
const cleanupService = new CleanupService();

module.exports = cleanupService;

