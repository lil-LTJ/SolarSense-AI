// prisma-client.js or database config
const { PrismaClient } = require('@prisma/client');

// For production - with SSL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?ssl=true&sslmode=require&connection_limit=20"
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

// Test SSL connection
const testDatabaseSSL = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database SSL connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database SSL connection failed:', error.message);
    return false;
  }
};

// Call this on startup
testDatabaseSSL();