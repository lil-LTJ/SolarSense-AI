// error-handler.js
const safeErrorHandler = (err, req, res, next) => {
  console.error('Server Error:', err); // Log full error for developers
  
  // Don't send technical details to users
  const userFriendlyError = {
    error: 'Something went wrong',
    message: 'Please try again later',
    referenceId: crypto.randomBytes(4).toString('hex') // For support tracking
  };
  
  // Different responses based on error type
  if (err.name === 'ValidationError') {
    userFriendlyError.message = 'Invalid data provided';
  } else if (err.code === 'ECONNREFUSED') {
    userFriendlyError.message = 'Service temporarily unavailable';
  }
  
  res.status(500).json(userFriendlyError);
};

// In app.js
app.use(safeErrorHandler);