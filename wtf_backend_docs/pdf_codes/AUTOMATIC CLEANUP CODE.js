// report-cleanup-service.js
const fs = require('fs');
const path = require('path');

class ReportCleanupService {
  constructor(reportsDir, maxAgeHours = 24) {
    this.reportsDir = reportsDir;
    this.maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  }
  
  // Run cleanup manually
  cleanupOldReports() {
    console.log(`🧹 Cleaning up reports older than ${this.maxAgeMs/3600000} hours...`);
    
    try {
      const files = fs.readdirSync(this.reportsDir);
      let deletedCount = 0;
      const now = Date.now();
      
      files.forEach(file => {
        const filepath = path.join(this.reportsDir, file);
        const stats = fs.statSync(filepath);
        const ageMs = now - stats.mtimeMs; // Age in milliseconds
        
        if (ageMs > this.maxAgeMs) {
          fs.unlinkSync(filepath);
          deletedCount++;
          console.log(`🗑️ Deleted old report: ${file}`);
        }
      });
      
      console.log(`✅ Cleanup complete. Deleted ${deletedCount} old reports.`);
      return deletedCount;
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      return 0;
    }
  }
  
  // Schedule automatic cleanup (run every hour)
  startAutoCleanup() {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupOldReports();
    }, 60 * 60 * 1000); // 1 hour in milliseconds
    
    // Also run immediately on startup
    this.cleanupOldReports();
    
    console.log('✅ Automatic report cleanup scheduled (every hour)');
  }
  
  // Test cleanup works
  testCleanup() {
    console.log('🧪 Testing cleanup functionality...');
    
    // Create a test file with old timestamp
    const testFilename = `test_cleanup_${Date.now()}.pdf`;
    const testFilepath = path.join(this.reportsDir, testFilename);
    
    // Create empty test file
    fs.writeFileSync(testFilepath, 'test');
    
    // Set file modification time to 25 hours ago
    const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000);
    fs.utimesSync(testFilepath, twentyFiveHoursAgo, twentyFiveHoursAgo);
    
    // Run cleanup
    const deleted = this.cleanupOldReports();
    
    // Check if test file was deleted
    const stillExists = fs.existsSync(testFilepath);
    
    if (!stillExists) {
      console.log('✅ Cleanup test PASSED: Old file was deleted');
      return true;
    } else {
      console.log('❌ Cleanup test FAILED: Old file still exists');
      // Clean up test file manually
      fs.unlinkSync(testFilepath);
      return false;
    }
  }
}