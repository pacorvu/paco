// ============================================================================
// EMAIL SENDER - PYTHON SCRIPT IMPLEMENTATION
// ============================================================================
// This file uses a Python script to send emails via Gmail SMTP.
// The Python script handles the SMTP connection and email sending.
// ============================================================================

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.resolve(__dirname, '../utils/send_otp_email.py');

/**
 * Initializes the email service (no-op for Python script, kept for compatibility)
 * @returns {Promise<void>}
 */
export async function initializeEmailService() {
  // Check if credentials are available
  const fromEmail = process.env.GMAIL_USER;
  const fromPassword = process.env.GMAIL_APP_PASS;

  if (!fromEmail || !fromPassword) {
    console.warn('[OTP Email] ⚠️  Email credentials not set. Email service will not be available.');
    console.warn('[OTP Email]    Set GMAIL_USER and GMAIL_APP_PASS environment variables.');
    return;
  }

  // Check if Python is available
  const pythonInterpreter = process.env.PYTHON_PATH || 'python';
  console.log(`[OTP Email] 🔌 Email service ready (using Python: ${pythonInterpreter})`);
  console.log(`[OTP Email]    Script: ${scriptPath}`);
  console.log(`[OTP Email]    From: ${fromEmail}`);
}

/**
 * Sends an OTP email to the recipient using Python script
 * @param {string} recipientEmail - The email address to send the OTP to
 * @param {string} otp - The one-time password to send
 * @returns {Promise<void>}
 */
export async function sendOtpEmail(recipientEmail, otp) {
  const totalStartTime = Date.now();
  const pythonInterpreter = process.env.PYTHON_PATH || 'python';

  // Check if credentials are available
  const fromEmail = process.env.GMAIL_USER;
  const fromPassword = process.env.GMAIL_APP_PASS;

  if (!fromEmail || !fromPassword) {
    throw new Error(
      'Email credentials are not set in environment variables. ' +
      'Please set GMAIL_USER and GMAIL_APP_PASS.'
    );
  }

  return new Promise((resolve, reject) => {
    const child = spawn(pythonInterpreter, [scriptPath, recipientEmail, otp], {
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      const totalDuration = Date.now() - totalStartTime;

      if (code === 0) {
        console.log(`[OTP Email] ✅ Sent successfully to ${recipientEmail}`);
        console.log(`[OTP Email] ⏱️  Total time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
        if (stdout.trim()) {
          console.log(`[OTP Email]    ${stdout.trim()}`);
        }
        resolve();
      } else {
        const errorMessage = stderr.trim() || 
          `send_otp_email.py exited with code ${code ?? 'unknown'}`;
        console.error(`[OTP Email] ❌ Failed to send to ${recipientEmail} after ${totalDuration}ms`);
        console.error(`[OTP Email] Error: ${errorMessage}`);
        
        // Provide helpful error messages
        if (errorMessage.includes('Authentication error')) {
          reject(new Error(
            'Authentication error: Check your email and app password. ' +
            'Make sure GMAIL_USER and GMAIL_APP_PASS are set correctly.'
          ));
        } else if (errorMessage.includes('GMAIL_USER') || errorMessage.includes('GMAIL_APP_PASS')) {
          reject(new Error(
            'Email credentials are not set. Please set GMAIL_USER and GMAIL_APP_PASS environment variables.'
          ));
        } else {
          reject(new Error(`Failed to send email: ${errorMessage}`));
        }
      }
    });

    child.on('error', (err) => {
      const totalDuration = Date.now() - totalStartTime;
      console.error(`[OTP Email] ❌ Failed to execute Python script after ${totalDuration}ms`);
      console.error(`[OTP Email] Error: ${err.message}`);
      
      if (err.code === 'ENOENT') {
        reject(new Error(
          `Python interpreter not found: ${pythonInterpreter}. ` +
          'Please install Python or set PYTHON_PATH environment variable.'
        ));
      } else {
        reject(new Error(`Failed to execute email script: ${err.message}`));
      }
    });
  });
}

