// file-permission-manager.js
const fs = require('fs');
const path = require('path');

class FilePermissionManager {
  constructor() {
    this.reportsDir = path.join(__dirname, 'reports');
    this.setupSecureDirectory();
  }
  
  setupSecureDirectory() {
    // Create reports directory if it doesn't exist
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { 
        recursive: true,
        mode: 0o750  // 750 permissions: rwxr-x--- (owner: rwx, group: r-x, others: ---)
      });
      console.log('✅ Created secure reports directory');
    }
    
    // Verify directory permissions
    const stats = fs.statSync(this.reportsDir);
    const mode = stats.mode.toString(8); // Convert to octal
    
    // 750 in octal = rwxr-x---
    // Owner: read, write, execute (7 = 111 in binary)
    // Group: read, execute (5 = 101 in binary)  
    // Others: nothing (0 = 000 in binary)
    
    if (mode !== '40750') {
      console.warn('⚠️ Reports directory has wrong permissions. Fixing...');
      fs.chmodSync(this.reportsDir, 0o750);
    }
  }
  
  saveReport(pdfBuffer, assessmentId) {
    const filename = `report_${assessmentId}_${Date.now()}.pdf`;
    const filepath = path.join(this.reportsDir, filename);
    
    // Save PDF with secure permissions
    fs.writeFileSync(filepath, pdfBuffer);
    
    // Set file permissions: 644 = rw-r--r--
    // Owner: read, write (6 = 110)
    // Group: read (4 = 100)
    // Others: read (4 = 100)
    fs.chmodSync(filepath, 0o644);
    
    console.log(`✅ Saved report with secure permissions: ${filename}`);
    return filename;
  }
  
  getReportPath(filename) {
    // Validate filename format to prevent directory traversal
    if (!this.isValidFilename(filename)) {
      throw new Error('Invalid filename');
    }
    
    const filepath = path.join(this.reportsDir, filename);
    
    // Check file exists and has correct permissions
    if (!fs.existsSync(filepath)) {
      throw new Error('Report not found');
    }
    
    return filepath;
  }
  
  isValidFilename(filename) {
    // Only allow alphanumeric, underscore, hyphen, and .pdf
    return /^report_[a-zA-Z0-9_-]+_\d+\.pdf$/.test(filename);
  }
}