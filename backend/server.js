import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { getSupabaseClient } from './database/supabase.js';
// Email service removed - OTP no longer required
import apiRoutes from './routes/apiRoutes.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not set in .env file');
  console.error('Please create a .env file in the backend directory with:');
  console.error('JWT_SECRET=your-super-secret-jwt-key-change-this-in-production');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? false : undefined, // Disable CSP in production for React Router
})); // Security headers
app.use(cors({
  origin: isProduction ? false : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes (must come before static file serving)
app.use('/api', apiRoutes);

// Serve static files from React app in production
if (isProduction) {
  // Path to frontend build directory
  const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
  
  // Serve static files
  app.use(express.static(frontendBuildPath));
  
  // Catch all handler: send back React's index.html file for client-side routing
  // This handles all non-API routes and serves the React app
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes (shouldn't reach here, but safety check)
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
      if (err) {
        res.status(500).send('Error loading application');
      }
    });
  });
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Verify Supabase connection
    try {
      const supabase = getSupabaseClient();
      // Test connection by querying a table (this will fail gracefully if tables don't exist yet)
      const { error } = await supabase.from('register').select('id').limit(1);
      if (error && error.code !== '42P01') { // 42P01 is "relation does not exist" - that's OK
        console.warn('⚠️  Supabase connection warning:', error.message);
        console.warn('   Make sure you have run the migration SQL in Supabase');
      } else {
        console.log('✅ Connected to Supabase');
      }
    } catch (supabaseError) {
      console.error('❌ Supabase connection error:', supabaseError.message);
      console.error('   Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
      // Don't exit - let server start anyway, connection will be retried on first use
    }
    
    // Email service initialization removed - OTP no longer required for registration
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      if (isProduction) {
        console.log(`📦 Serving frontend from: ${path.join(__dirname, '..', 'frontend', 'dist')}`);
        console.log(`🌍 Application available at: http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

