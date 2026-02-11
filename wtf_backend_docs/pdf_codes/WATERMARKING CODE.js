// pdf-watermark-service.js
const PDFDocument = require('pdfkit');

class PDFWatermarkService {
  addWatermark(doc, assessmentId) {
    // Add light gray watermark at the bottom of every page
    doc.on('pageAdded', () => {
      doc.save()
         .fillOpacity(0.3)  // 30% opacity - barely visible
         .fillColor('lightgray')
         .fontSize(8)
         .text(
           `SolarSense Report ID: ${assessmentId} | Generated: ${new Date().toISOString()} | Do not share publicly`,
           50,  // x position
           doc.page.height - 40,  // y position (bottom)
           {
             align: 'center',
             width: doc.page.width - 100
           }
         )
         .restore();
    });
    
    // Also add to first page
    doc.fillOpacity(0.3)
       .fillColor('lightgray')
       .fontSize(8)
       .text(
         `Report ID: ${assessmentId}`,
         50,
         doc.page.height - 20,
         { align: 'center' }
       )
       .restore();
  }
  
  generateReport(data) {
    const doc = new PDFDocument();
    const chunks = [];
    
    // Create watermark service
    const watermark = new PDFWatermarkService();
    
    // Pipe PDF to buffer
    doc.on('data', chunks.push.bind(chunks));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      return pdfBuffer;
    });
    
    // Add watermark
    watermark.addWatermark(doc, data.assessmentId);
    
    // Add content
    doc.fontSize(20).text('SolarSense AI Assessment Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Business: ${data.businessName}`);
    // ... more content
    
    doc.end();
  }
}