// Use Supabase instead of SQLite
import { db, getSupabaseClient } from '../database/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createOtpChallenge, verifyOtpChallenge } from '../services/otpService.js';
import { initializeEmailService } from '../services/emailService.js';

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
      body: req.body ? { ...req.body, password: req.body.password ? '[REDACTED]' : undefined } : null
    };
  }

  console.error('='.repeat(80));
  console.error(`[ERROR] ${context} - ${timestamp}`);
  console.error(JSON.stringify(logData, null, 2));
  console.error('='.repeat(80));
};

const logInfo = (context, data, req = null) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    context,
    ...data
  };

  if (req) {
    logData.request = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    };
  }

  console.log(`[INFO] ${context} - ${timestamp}`, JSON.stringify(logData, null, 2));
};

// Helper function to log login attempts
async function logLoginAttempt(loginData) {
  try {
    const supabase = getSupabaseClient();
    await supabase
      .from('login')
      .insert(loginData);
  } catch (error) {
    logError('Failed to log login attempt to database', error);
    // Don't throw - logging failure shouldn't break login
  }
}

// Generate JWT Token
const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Please set it in your .env file.');
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Send OTP for registration (Admin only)
// @route   POST /api/auth/register/send-otp
// @access  Admin only
export const sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      logInfo('Registration OTP request - missing email', { email: null }, req);
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    logInfo('Registration OTP request', { email }, req);

    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM register WHERE email = ?', [email]);
    if (existingUser) {
      logInfo('Registration OTP request - user already exists', { email }, req);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create and send OTP
    const otpChallenge = await createOtpChallenge({
      email,
      purpose: 'REGISTRATION'
    });

    logInfo('Registration OTP sent successfully', { email, requestId: otpChallenge.requestId }, req);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      requestId: otpChallenge.requestId,
      expiresInMinutes: otpChallenge.expiresInMinutes
    });
  } catch (error) {
    logError('Send registration OTP error', error, req);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
};

// @desc    Register user with OTP verification (Admin only)
// @route   POST /api/auth/register
// @access  Admin only
export const register = async (req, res) => {
  try {
    const { name, email, password, role, otpRequestId, otp } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (!otpRequestId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP verification required. Please request an OTP first.'
      });
    }

    // Validate role
    if (role && !['admin', 'vc'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin or vc'
      });
    }

    // Verify OTP first
    try {
      await verifyOtpChallenge({
        requestId: otpRequestId,
        otp,
        expectedPurpose: 'REGISTRATION'
      });
    } catch (otpError) {
      return res.status(400).json({
        success: false,
        message: otpError.message || 'Invalid or expired OTP'
      });
    }

    // Check if user exists (double check)
    const existingUser = await db.get('SELECT id FROM register WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in register table
    const result = await db.run(
      'INSERT INTO register (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'vc']
    );

    const userId = result.lastID;

    // Get created user (without password)
    const user = await db.get(
      'SELECT id, name, email, role, created_at FROM register WHERE id = ?',
      [userId]
    );

    // Generate token
    const token = generateToken(user.id, user.role);

    logInfo('User registration successful', { email, userId: user.id, role: user.role }, req);

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    logError('Registration error', error, req);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      logInfo('Login attempt - missing credentials', { 
        hasEmail: !!email, 
        hasPassword: !!password 
      }, req);
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    logInfo('Login attempt initiated', { email }, req);

    // Check for user in register table
    let user;
    try {
      user = await db.get('SELECT * FROM register WHERE email = ?', [email]);
    } catch (dbError) {
      logError('Database query error during login', dbError, req);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred. Please try again later.'
      });
    }
    
    // Log login attempt
    const loginLog = {
      email,
      user_id: null,
      login_status: 'FAILED',
      ip_address: req.ip || req.connection?.remoteAddress || 'unknown',
      user_agent: req.get('user-agent') || 'unknown',
      failure_reason: null,
      timestamp: new Date().toISOString()
    };

    if (!user) {
      loginLog.failure_reason = 'User not found';
      await logLoginAttempt(loginLog);
      logInfo('Login failed - user not found', { email }, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    loginLog.user_id = user.id;

    // Check password
    if (!user.password) {
      loginLog.failure_reason = 'Password missing in database';
      await logLoginAttempt(loginLog);
      logError('Login error - password missing in database', 
        new Error(`User ${user.id} (${email}) has no password in database`), req);
      return res.status(500).json({
        success: false,
        message: 'Database error: user password not found'
      });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      loginLog.failure_reason = 'Password comparison error';
      await logLoginAttempt(loginLog);
      logError('Login error - bcrypt comparison failed', bcryptError, req);
      return res.status(500).json({
        success: false,
        message: 'Error verifying password. Please try again.'
      });
    }

    if (!isMatch) {
      loginLog.failure_reason = 'Invalid password';
      await logLoginAttempt(loginLog);
      logInfo('Login failed - invalid password', { email, userId: user.id }, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    let token;
    try {
      token = generateToken(user.id, user.role);
    } catch (tokenError) {
      loginLog.failure_reason = 'Token generation error';
      await logLoginAttempt(loginLog);
      logError('Login error - token generation failed', tokenError, req);
      return res.status(500).json({
        success: false,
        message: 'Error generating authentication token',
        error: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
      });
    }

    // Log successful login
    loginLog.login_status = 'SUCCESS';
    loginLog.failure_reason = null;
    await logLoginAttempt(loginLog);
    logInfo('Login successful', { email, userId: user.id, role: user.role }, req);

    // Remove password from response
    delete user.password;
    delete user.reset_token;
    delete user.reset_token_expiry;

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    logError('Login error - unexpected exception', error, req);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, name, email, role, created_at FROM register WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    logError('Get current user error', error, req);
    res.status(500).json({
      success: false,
      message: 'Error getting user',
      error: error.message
    });
  }
};

// @desc    Send OTP for password reset
// @route   POST /api/auth/forgot-password/send-otp
// @access  Public
export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Check if user exists in register table
    const user = await db.get('SELECT id FROM register WHERE email = ?', [email]);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If that email exists, an OTP has been sent'
      });
    }

    // Create and send OTP
    const otpChallenge = await createOtpChallenge({
      email,
      purpose: 'PASSWORD_RESET'
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      requestId: otpChallenge.requestId,
      expiresInMinutes: otpChallenge.expiresInMinutes
    });
  } catch (error) {
    logError('Send password reset OTP error', error, req);
    // Don't reveal if user exists or not
    res.status(200).json({
      success: true,
      message: 'If that email exists, an OTP has been sent'
    });
  }
};

// @desc    Forgot password (legacy endpoint - kept for compatibility)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  // Redirect to send OTP endpoint
  return sendPasswordResetOtp(req, res);
};

// @desc    Reset password with OTP verification
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { otpRequestId, otp, password } = req.body;

    if (!otpRequestId || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide OTP request ID, OTP, and new password'
      });
    }

    // Verify OTP
    let otpVerification;
    try {
      otpVerification = await verifyOtpChallenge({
        requestId: otpRequestId,
        otp,
        expectedPurpose: 'PASSWORD_RESET'
      });
    } catch (otpError) {
      return res.status(400).json({
        success: false,
        message: otpError.message || 'Invalid or expired OTP'
      });
    }

    // Get user by email from OTP verification
    const user = await db.get('SELECT id FROM register WHERE email = ?', [otpVerification.email]);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password in register table
    await db.update(
      'UPDATE register SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logError('Reset password error', error, req);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

