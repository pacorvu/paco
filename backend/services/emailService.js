// ============================================================================
// EMAIL SENDER - NODEMAILER IMPLEMENTATION
// ============================================================================
// This file was updated to use Nodemailer instead of Python script
// for better performance and integration with Node.js backend.
// 
// OLD IMPLEMENTATION (Python-based) - COMMENTED OUT FOR EASY ROLLBACK:
// ============================================================================
// import { spawn } from 'child_process';
// import path from 'path';
// import { fileURLToPath } from 'url';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const scriptPath = path.resolve(__dirname, '../scripts/send_otp_email.py');
//
// export function sendOtpEmail(recipientEmail, otp) {
//   const pythonInterpreter = process.env.PYTHON_PATH || 'python';
//
//   return new Promise((resolve, reject) => {
//     const child = spawn(pythonInterpreter, [scriptPath, recipientEmail, otp], {
//       env: process.env,
//     });
//
//     let stderr = '';
//
//     child.stderr.on('data', (chunk) => {
//       stderr += chunk.toString();
//     });
//
//     child.on('close', (code) => {
//       if (code === 0) {
//         resolve();
//       } else {
//         reject(
//           new Error(
//             stderr.trim() ||
//               `send_otp_email.py exited with code ${code ?? 'unknown'}`
//           )
//         );
//       }
//     });
//
//     child.on('error', (err) => {
//       reject(err);
//     });
//   });
// }
// ============================================================================

import nodemailer from 'nodemailer';

// Cached transporter to reuse connections (major performance improvement)
let cachedTransporter = null;
let isInitialized = false;
let initializationPromise = null;

/**
 * Creates and returns a reusable Nodemailer transporter
 * Uses environment variables for SMTP configuration
 * Caches the transporter to avoid recreating connections
 */
function getTransporter() {
  // Return cached transporter if it exists and is still valid
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const fromEmail = process.env.GMAIL_USER;
  const fromPassword = process.env.GMAIL_APP_PASS;

  if (!fromEmail || !fromPassword) {
    throw new Error(
      'Email credentials are not set in environment variables. ' +
      'Please set GMAIL_USER and GMAIL_APP_PASS.'
    );
  }

  // Create transporter with connection pooling and timeout optimizations
  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: fromEmail,
      pass: fromPassword,
    },
    // Connection pool settings for better performance
    pool: true, // Use connection pooling
    maxConnections: 5, // Maximum number of connections in the pool
    maxMessages: 100, // Maximum number of messages per connection
    // Timeout settings to prevent hanging
    connectionTimeout: 5000, // 5 seconds to establish connection
    greetingTimeout: 5000, // 5 seconds for SMTP greeting
    socketTimeout: 10000, // 10 seconds for socket operations
    // Keep connection alive
    logger: false, // Disable verbose logging (set to true for debugging)
    debug: false, // Disable debug output
  });

  return cachedTransporter;
}

/**
 * Initializes and verifies the email transporter on server startup
 * This pre-warms the SMTP connection so the first email is fast
 * Non-blocking - server will start even if email initialization fails
 * @returns {Promise<void>}
 */
export async function initializeEmailService() {
  // If already initialized or initializing, return the existing promise
  if (isInitialized) {
    return;
  }
  
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const startTime = Date.now();
    
    try {
      // Check if credentials are available
      const fromEmail = process.env.GMAIL_USER;
      const fromPassword = process.env.GMAIL_APP_PASS;

      if (!fromEmail || !fromPassword) {
        console.warn('[OTP Email] ⚠️  Email credentials not set. Email service will not be available.');
        console.warn('[OTP Email]    Set GMAIL_USER and GMAIL_APP_PASS environment variables.');
        return;
      }

      // Create and verify transporter
      console.log('[OTP Email] 🔌 Initializing email service...');
      const transporter = getTransporter();
      
      // Verify the connection (this establishes the SMTP connection)
      await new Promise((resolve, reject) => {
        transporter.verify((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      const duration = Date.now() - startTime;
      isInitialized = true;
      console.log(`[OTP Email] ✅ Email service initialized and ready (${duration}ms)`);
      console.log(`[OTP Email]    SMTP: ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || '587'}`);
      console.log(`[OTP Email]    From: ${fromEmail}`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[OTP Email] ❌ Failed to initialize email service (${duration}ms)`);
      console.error(`[OTP Email]    Error: ${error.message}`);
      console.warn('[OTP Email]    Server will continue, but email sending may fail.');
      console.warn('[OTP Email]    Check your SMTP credentials and network connection.');
      
      // Clear the cached transporter on failure so it can retry later
      cachedTransporter = null;
      isInitialized = false;
      
      // Don't throw - let server start anyway
    }
  })();

  return initializationPromise;
}

/**
 * Sends an OTP email to the recipient
 * @param {string} recipientEmail - The email address to send the OTP to
 * @param {string} otp - The one-time password to send
 * @returns {Promise<void>}
 */
export async function sendOtpEmail(recipientEmail, otp) {
  const totalStartTime = Date.now();
  let transporterTime = 0;
  let sendTime = 0;
  
  try {
    // Get transporter (cached, so should be instant if initialized)
    const transporterStartTime = Date.now();
    const transporter = getTransporter();
    transporterTime = Date.now() - transporterStartTime;
    
    // If not initialized yet, try to initialize now (fallback)
    if (!isInitialized && !initializationPromise) {
      console.warn('[OTP Email] ⚠️  Email service not initialized. Initializing now...');
      await initializeEmailService();
    }

    // Extract username from email (e.g., "paco.rvu@gmail.com" -> "paco")
    const emailUsername = process.env.GMAIL_USER?.split('@')[0] || 'User';
    const displayName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    
    const mailOptions = {
      from: `${displayName} <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject: "Your One-Time Password (OTP)",
      text: `Your OTP is: ${otp}\n\nThis code will expire in 10 minutes.`,
    };

    // Send email
    const sendStartTime = Date.now();
    const info = await transporter.sendMail(mailOptions);
    sendTime = Date.now() - sendStartTime;
    
    const totalDuration = Date.now() - totalStartTime;
    
    // Log success with detailed timing breakdown
    console.log(`[OTP Email] ✅ Sent successfully to ${recipientEmail}`);
    console.log(`[OTP Email] 📧 Message ID: ${info.messageId}`);
    console.log(`[OTP Email] ⏱️  Timing breakdown:`);
    console.log(`[OTP Email]    - Transporter: ${transporterTime}ms ${transporterTime === 0 ? '(pre-warmed ✅)' : '(cold start)'}`);
    console.log(`[OTP Email]    - SMTP Send: ${sendTime}ms`);
    console.log(`[OTP Email]    - Total: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    
    // Performance feedback
    if (totalDuration < 2000) {
      console.log(`[OTP Email] 🚀 Excellent performance!`);
    } else if (totalDuration < 5000) {
      console.log(`[OTP Email] ✅ Good performance (normal for Gmail SMTP)`);
    } else if (totalDuration < 10000) {
      console.warn(`[OTP Email] ⚠️  Slow email send (${(totalDuration / 1000).toFixed(1)}s). This may be due to Gmail SMTP processing or network latency.`);
    } else {
      console.error(`[OTP Email] 🐌 Very slow email send (${(totalDuration / 1000).toFixed(1)}s). Check network connection and SMTP server.`);
    }
  } catch (error) {
    const totalDuration = Date.now() - totalStartTime;
    
    // Log error with detailed timing information
    console.error(`[OTP Email] ❌ Failed to send to ${recipientEmail} after ${totalDuration}ms`);
    console.error(`[OTP Email] Error:`, error.message);
    
    // Clear cached transporter on authentication errors to force recreation
    if (error.code === 'EAUTH') {
      cachedTransporter = null;
      throw new Error(
        'Authentication error: Check your email and app password. ' +
        'Make sure GMAIL_USER and GMAIL_APP_PASS are set correctly.'
      );
    }
    
    // Clear cache on connection errors to allow retry with fresh connection
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.warn(`[OTP Email] Connection error detected. Clearing transporter cache.`);
      cachedTransporter = null;
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

