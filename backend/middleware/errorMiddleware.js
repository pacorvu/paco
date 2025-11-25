// Enhanced logging utility
const logError = (context, error, req = null) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    context,
    error: {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Error',
      ...(error?.code && { code: error.code }),
      ...(error?.statusCode && { statusCode: error.statusCode })
    }
  };

  if (req) {
    logData.request = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      body: req.body ? { ...req.body, password: req.body.password ? '[REDACTED]' : undefined } : null,
      query: req.query || null,
      params: req.params || null
    };
  }

  console.error('='.repeat(80));
  console.error(`[ERROR] ${context} - ${timestamp}`);
  console.error(JSON.stringify(logData, null, 2));
  console.error('='.repeat(80));
};

// 404 Not Found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  logError('404 Not Found', error, req);
  res.status(404);
  next(error);
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log the error with full context
  logError('Unhandled Error', err, req);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    statusCode: statusCode
  });
};

