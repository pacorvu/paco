import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { getSupabaseClient } from './database/supabase.js';
import { initializeEmailService } from './services/emailService.js';
import apiRoutes from './routes/apiRoutes.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not set in .env file');
  console.error('Please create a .env file in the backend directory with:');
  console.error('JWT_SECRET=your-super-secret-jwt-key-change-this-in-production');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// API Routes
app.use('/api', apiRoutes);

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
    
    // Initialize email service (non-blocking)
    initializeEmailService().catch(err => {
      console.warn('Email service initialization failed, but server will continue:', err.message);
    });
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

