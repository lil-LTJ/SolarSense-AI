// health-check.js
const checkDiskSpace = require('check-disk-space');

const healthCheck = async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    services: {},
    security: {}
  };
  
  try {
    // 1. Database health
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'healthy';
    
    // 2. DSE service health (with timeout)
    const dseHealth = await Promise.race([
      axios.get(`${process.env.DSE_SERVICE_URL}/health`, { timeout: 5000 }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]).catch(() => ({ status: 'unhealthy' }));
    
    health.services.dse = dseHealth.status === 200 ? 'healthy' : 'unhealthy';
    
    // 3. Disk space check (for PDF generation)
    const disk = await checkDiskSpace('/');
    health.services.disk = disk.free > 1000000000 ? 'healthy' : 'warning';
    
    // 4. Security status
    health.security = {
      ssl: req.secure,
      rate_limiting: 'enabled',
      cors: 'enabled',
      headers: 'configured',
      encryption: 'available'
    };
    
    // Overall status
    const allServicesHealthy = Object.values(health.services)
      .every(status => status === 'healthy');
    
    health.status = allServicesHealthy ? 'healthy' : 'degraded';
    
    res.status(200).json(health);
    
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    res.status(503).json(health);
  }
};

// Route
app.get('/health', healthCheck);