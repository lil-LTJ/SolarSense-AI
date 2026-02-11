// encryption-service.js
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    // Get encryption key from environment variable
    this.algorithm = 'aes-256-gcm';
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  }
  
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      content: encrypted,
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm, 
      this.key, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Use in your models
const encryptSensitiveFields = (assessment) => {
  const encryptionService = new EncryptionService();
  
  if (assessment.monthlySpend) {
    assessment.monthlySpendEncrypted = encryptionService.encrypt(
      assessment.monthlySpend.toString()
    );
    delete assessment.monthlySpend; // Remove plain text
  }
  
  return assessment;
};