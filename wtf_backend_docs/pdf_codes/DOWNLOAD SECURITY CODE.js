// download-security-service.js
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

class DownloadSecurityService {
  constructor() {
    // Track download attempts per IP
    this.downloadAttempts = new Map();
    
    // Rate limiter for downloads
    this.downloadLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Max 10 downloads per hour per IP
      message: {
        error: 'Download limit exceeded',
        message: 'Maximum 10 downloads per hour. Please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Use IP + user agent for better tracking
        return req.ip + req.headers['user-agent'];
      }
    });
  }
  
  // Apply rate limiting middleware
  getRateLimitMiddleware() {
    return this.downloadLimiter;
  }
  
  // Generate secure download token (prevents guessing report IDs)
  generateDownloadToken(assessmentId) {
    const timestamp = Date.now();
    const secret = process.env.DOWNLOAD_SECRET;
    
    // Create token: hash(assessmentId + timestamp + secret)
    const token = crypto
      .createHash('sha256')
      .update(`${assessmentId}${timestamp}${secret}`)
      .digest('hex');
    
    // Token expires in 1 hour
    return {
      token,
      expires: timestamp + (60 * 60 * 1000),
      assessmentId
    };
  }
  
  // Validate download token
  validateDownloadToken(token, assessmentId) {
    const secret = process.env.DOWNLOAD_SECRET;
    
    // Recreate expected token
    const expectedToken = crypto
      .createHash('sha256')
      .update(`${assessmentId}${token.timestamp}${secret}`)
      .digest('hex');
    
    // Check if token matches and hasn't expired
    if (token.token !== expectedToken) {
      throw new Error('Invalid download token');
    }
    
    if (Date.now() > token.expires) {
      throw new Error('Download token expired');
    }
    
    return true;
  }
  
  // Validate report ID format
  isValidReportId(reportId) {
    // Format: ASSESS-ABC123-XYZ or similar
    return /^[A-Z0-9]{3,}-[A-Z0-9]{6,}-[A-Z0-9]{3,}$/.test(reportId);
  }
  
  // Log download attempts for security monitoring
  logDownloadAttempt(ip, reportId, success) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip,
      reportId,
      success,
      userAgent: this.getUserAgent(ip)
    };
    
    console.log('📥 Download attempt:', logEntry);
    
    // Store in security log
    this.saveToSecurityLog(logEntry);
  }
}

// Usage in routes
const downloadSecurity = new DownloadSecurityService();

// Download endpoint with all security
app.get('/api/v1/reports/:reportId/download', 
  downloadSecurity.getRateLimitMiddleware(),  // Rate limiting
  async (req, res) => {
    try {
      const { reportId } = req.params;
      
      // 1. Validate report ID format
      if (!downloadSecurity.isValidReportId(reportId)) {
        downloadSecurity.logDownloadAttempt(req.ip, reportId, false);
        return res.status(400).json({ error: 'Invalid report ID' });
      }
      
      // 2. Check if report exists (in database)
      const report = await prisma.assessment.findUnique({
        where: { id: reportId },
        select: { pdfFilename: true }
      });
      
      if (!report || !report.pdfFilename) {
        downloadSecurity.logDownloadAttempt(req.ip, reportId, false);
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // 3. Get file path (with permission manager)
      const filepath = permissionManager.getReportPath(report.pdfFilename);
      
      // 4. Set secure headers for download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="SolarSense_Report_${reportId}.pdf"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      
      // 5. Log successful download
      downloadSecurity.logDownloadAttempt(req.ip, reportId, true);
      
      // 6. Stream the file
      const stream = fs.createReadStream(filepath);
      stream.pipe(res);
      
      stream.on('error', () => {
        res.status(500).json({ error: 'Error downloading report' });
      });
      
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download report' });
    }
  }
);