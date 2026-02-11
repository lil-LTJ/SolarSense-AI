// safe-queries.js
class SafeQueries {
  constructor(prisma) {
    this.prisma = prisma;
  }
  
  // Safe way to find assessment by ID
  async findAssessmentById(id) {
    // Validate ID format first
    if (!this.isValidId(id)) {
      throw new Error('Invalid ID format');
    }
    
    // Use Prisma's safe parameterized query
    return await this.prisma.assessment.findUnique({
      where: { id },
      include: { equipment: true, result: true }
    });
  }
  
  // Safe raw query example
  async getAssessmentsByCity(city) {
    // Validate city input
    const safeCity = this.sanitizeString(city);
    
    // Parameterized query
    return await this.prisma.$queryRaw`
      SELECT * FROM "Assessment" 
      WHERE city = ${safeCity}
      ORDER BY "createdAt" DESC
      LIMIT 100
    `;
  }
  
  // NEVER DO THIS - UNSAFE!
  async unsafeQuery(userInput) {
    // ❌ DANGER: SQL Injection vulnerability!
    return await this.prisma.$queryRaw(
      `SELECT * FROM users WHERE email = '${userInput}'`
    );
  }
  
  // Validation helpers
  isValidId(id) {
    return /^[a-zA-Z0-9_-]{20,}$/.test(id);
  }
  
  sanitizeString(input) {
    return input.replace(/[^a-zA-Z0-9\s-]/g, '').substring(0, 100);
  }
}