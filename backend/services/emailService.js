// ============================================================================
// EMAIL SENDER - GMAIL SMTP
// ============================================================================
// This file uses Gmail SMTP via Python script for sending OTP emails.
// ============================================================================

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Using SMTP script
const scriptPath = path.resolve(__dirname, '../utils/send_otp_email.py');

/**
 * Detects the available Python interpreter
 * @returns {Promise<string>} Path to Python interpreter
 */
async function detectPythonInterpreter() {
  // If explicitly set, use it
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }

  // Try to find Python by testing common names
  const candidates = ['python3', 'python'];
  
  for (const candidate of candidates) {
    try {
      const result = await new Promise((resolve) => {
        const testProcess = spawn(candidate, ['--version'], {
          stdio: 'pipe',
          env: process.env
        });

        let hasOutput = false;
        testProcess.stdout.on('data', () => {
          hasOutput = true;
        });

        testProcess.on('close', (code) => {
          resolve(code === 0 && hasOutput);
        });

        testProcess.on('error', () => {
          resolve(false);
        });
      });

      if (result) {
        return candidate;
      }
    } catch (err) {
      // Continue to next candidate
    }
  }

  // Default fallback
  return 'python';
}

/**
 * Sends OTP email using Gmail SMTP via Python script
 * @param {string} recipientEmail - The email address to send the OTP to
 * @param {string} otp - The one-time password to send
 * @returns {Promise<void>}
 */
async function sendOtpEmailViaSmtp(recipientEmail, otp) {
  const totalStartTime = Date.now();
  const pythonInterpreter = await detectPythonInterpreter();

  // Check if Python script exists
  if (!fs.existsSync(scriptPath)) {
    const errorMsg = `Python script not found at: ${scriptPath}`;
    console.error(`[OTP Email] ❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Check if email credentials are available in environment variables
  const fromEmail = process.env.GMAIL_USER;
  const fromPassword = process.env.GMAIL_APP_PASS;

  if (!fromEmail || !fromPassword) {
    const errorMsg = 'Email credentials are not set in environment variables. Please set GMAIL_USER and GMAIL_APP_PASS.';
    console.error(`[OTP Email] ❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Log script path for debugging
  console.log(`[OTP Email] 📝 Using script: ${scriptPath}`);
  console.log(`[OTP Email] 🐍 Using Python: ${pythonInterpreter}`);

  return new Promise((resolve, reject) => {
    const child = spawn(pythonInterpreter, [scriptPath, recipientEmail, otp], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'] // Explicitly set stdio
    });

    let stdout = '';
    let stderr = '';
    let isResolved = false;

    // Set a timeout (30 seconds) to prevent hanging
    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        child.kill('SIGTERM');
        const totalDuration = Date.now() - totalStartTime;
        console.error(`[OTP Email] ❌ Timeout after ${totalDuration}ms (30s limit)`);
        reject(new Error(
          'Email sending timed out. The connection to the email server took too long. ' +
          'This may be due to network issues or firewall restrictions. Please try again later.'
        ));
      }
    }, 30000); // 30 second timeout

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      
      if (isResolved) {
        return; // Already handled by timeout
      }
      const totalDuration = Date.now() - totalStartTime;

      if (code === 0) {
        isResolved = true;
        console.log(`[OTP Email] ✅ Sent successfully to ${recipientEmail}`);
        console.log(`[OTP Email] ⏱️  Total time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
        if (stdout.trim()) {
          console.log(`[OTP Email]    ${stdout.trim()}`);
        }
        resolve();
      } else {
        isResolved = true;
        const errorMessage = stderr.trim() || stdout.trim() || 
          `send_otp_email.py exited with code ${code ?? 'unknown'}`;
        console.error(`[OTP Email] ❌ Failed to send to ${recipientEmail} after ${totalDuration}ms`);
        console.error(`[OTP Email] Exit code: ${code}`);
        console.error(`[OTP Email] Script path: ${scriptPath}`);
        console.error(`[OTP Email] Python interpreter: ${pythonInterpreter}`);
        console.error(`[OTP Email] Stdout: ${stdout.trim() || '(empty)'}`);
        console.error(`[OTP Email] Stderr: ${stderr.trim() || '(empty)'}`);
        console.error(`[OTP Email] Full error: ${errorMessage}`);
        
        // Provide helpful error messages
        if (errorMessage.includes('Authentication error') || errorMessage.includes('SMTPAuthenticationError')) {
          reject(new Error(
            'Authentication error: Check your email and app password. ' +
            'Make sure GMAIL_USER and GMAIL_APP_PASS are set correctly.'
          ));
        } else if (errorMessage.includes('Network error') || errorMessage.includes('Network is unreachable') || 
                   errorMessage.includes('Connection refused') || errorMessage.includes('Connection error')) {
          reject(new Error(
            'Network error: Cannot connect to email server. ' +
            'Please check your network connection and firewall settings.'
          ));
        } else if (errorMessage.includes('GMAIL_USER') || errorMessage.includes('GMAIL_APP_PASS')) {
          reject(new Error(
            'Email credentials are not set. Please set GMAIL_USER and GMAIL_APP_PASS environment variables.'
          ));
        } else if (errorMessage.includes('No such file') || errorMessage.includes('ENOENT')) {
          reject(new Error(
            `Python script not found at: ${scriptPath}. Please check the file path.`
          ));
        } else {
          reject(new Error(`Failed to send email: ${errorMessage}`));
        }
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      
      if (isResolved) {
        return; // Already handled by timeout or other error
      }
      
      isResolved = true;
      const totalDuration = Date.now() - totalStartTime;
      console.error(`[OTP Email] ❌ Failed to execute Python script after ${totalDuration}ms`);
      console.error(`[OTP Email] Error code: ${err.code}`);
      console.error(`[OTP Email] Error message: ${err.message}`);
      console.error(`[OTP Email] Script path: ${scriptPath}`);
      console.error(`[OTP Email] Python interpreter: ${pythonInterpreter}`);
      
      if (err.code === 'ENOENT') {
        reject(new Error(
          `Python interpreter not found: ${pythonInterpreter}. ` +
          'Please install Python or set PYTHON_PATH environment variable. ' +
          `Tried to execute: ${pythonInterpreter} ${scriptPath}`
        ));
      } else {
        reject(new Error(`Failed to execute email script: ${err.message} (code: ${err.code})`));
      }
    });
  });
}

// ============================================================================
// OLD SMTP-BASED FUNCTION (NOW ACTIVE)
// ============================================================================
// /**
//  * Sends OTP email using Gmail SMTP via Python script
//  * @param {string} recipientEmail - The email address to send the OTP to
//  * @param {string} otp - The one-time password to send
//  * @returns {Promise<void>}
//  */
// async function sendOtpEmailViaSmtp(recipientEmail, otp) {
//   const totalStartTime = Date.now();
//   const pythonInterpreter = await detectPythonInterpreter();

//   // Check if credentials are available
//   const fromEmail = process.env.GMAIL_USER;
//   const fromPassword = process.env.GMAIL_APP_PASS;

//   if (!fromEmail || !fromPassword) {
//     throw new Error(
//       'Email credentials are not set in environment variables. ' +
//       'Please set GMAIL_USER and GMAIL_APP_PASS.'
//     );
//   }

//   // Check if Python script exists
//   if (!fs.existsSync(scriptPath)) {
//     const errorMsg = `Python script not found at: ${scriptPath}`;
//     console.error(`[OTP Email] ❌ ${errorMsg}`);
//     throw new Error(errorMsg);
//   }

//   // Log script path for debugging
//   console.log(`[OTP Email] 📝 Using script: ${scriptPath}`);
//   console.log(`[OTP Email] 🐍 Using Python: ${pythonInterpreter}`);

//   return new Promise((resolve, reject) => {
//     const child = spawn(pythonInterpreter, [scriptPath, recipientEmail, otp], {
//       env: process.env,
//       stdio: ['ignore', 'pipe', 'pipe'] // Explicitly set stdio
//     });

//     let stdout = '';
//     let stderr = '';
//     let isResolved = false;

//     // Set a timeout (30 seconds) to prevent hanging
//     const timeout = setTimeout(() => {
//       if (!isResolved) {
//         isResolved = true;
//         child.kill('SIGTERM');
//         const totalDuration = Date.now() - totalStartTime;
//         console.error(`[OTP Email] ❌ Timeout after ${totalDuration}ms (30s limit)`);
//         reject(new Error(
//           'Email sending timed out. The connection to the email server took too long. ' +
//           'This may be due to network issues or firewall restrictions. Please try again later.'
//         ));
//       }
//     }, 30000); // 30 second timeout

//     child.stdout.on('data', (chunk) => {
//       stdout += chunk.toString();
//     });

//     child.stderr.on('data', (chunk) => {
//       stderr += chunk.toString();
//     });

//     child.on('close', (code) => {
//       clearTimeout(timeout);
      
//       if (isResolved) {
//         return; // Already handled by timeout
//       }
//       const totalDuration = Date.now() - totalStartTime;

//       if (code === 0) {
//         isResolved = true;
//         console.log(`[OTP Email] ✅ Sent successfully to ${recipientEmail}`);
//         console.log(`[OTP Email] ⏱️  Total time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
//         if (stdout.trim()) {
//           console.log(`[OTP Email]    ${stdout.trim()}`);
//         }
//         resolve();
//       } else {
//         isResolved = true;
//         const errorMessage = stderr.trim() || stdout.trim() || 
//           `send_otp_email.py exited with code ${code ?? 'unknown'}`;
//         console.error(`[OTP Email] ❌ Failed to send to ${recipientEmail} after ${totalDuration}ms`);
//         console.error(`[OTP Email] Exit code: ${code}`);
//         console.error(`[OTP Email] Script path: ${scriptPath}`);
//         console.error(`[OTP Email] Python interpreter: ${pythonInterpreter}`);
//         console.error(`[OTP Email] Stdout: ${stdout.trim() || '(empty)'}`);
//         console.error(`[OTP Email] Stderr: ${stderr.trim() || '(empty)'}`);
//         console.error(`[OTP Email] Full error: ${errorMessage}`);
        
//         // Provide helpful error messages
//         if (errorMessage.includes('Authentication error') || errorMessage.includes('SMTPAuthenticationError')) {
//           reject(new Error(
//             'Authentication error: Check your email and app password. ' +
//             'Make sure GMAIL_USER and GMAIL_APP_PASS are set correctly.'
//           ));
//         } else if (errorMessage.includes('Network error') || errorMessage.includes('Network is unreachable') || 
//                    errorMessage.includes('Connection refused') || errorMessage.includes('Connection error')) {
//           reject(new Error(
//             'Network error: Cannot connect to email server. ' +
//             'Please check your network connection and firewall settings.'
//           ));
//         } else if (errorMessage.includes('GMAIL_USER') || errorMessage.includes('GMAIL_APP_PASS')) {
//           reject(new Error(
//             'Email credentials are not set. Please set GMAIL_USER and GMAIL_APP_PASS environment variables.'
//           ));
//         } else if (errorMessage.includes('No such file') || errorMessage.includes('ENOENT')) {
//           reject(new Error(
//             `Python script not found at: ${scriptPath}. Please check the file path.`
//           ));
//         } else {
//           reject(new Error(`Failed to send email: ${errorMessage}`));
//         }
//       }
//     });

//     child.on('error', (err) => {
//       clearTimeout(timeout);
      
//       if (isResolved) {
//         return; // Already handled by timeout or other error
//       }
      
//       isResolved = true;
//       const totalDuration = Date.now() - totalStartTime;
//       console.error(`[OTP Email] ❌ Failed to execute Python script after ${totalDuration}ms`);
//       console.error(`[OTP Email] Error code: ${err.code}`);
//       console.error(`[OTP Email] Error message: ${err.message}`);
//       console.error(`[OTP Email] Script path: ${scriptPath}`);
//       console.error(`[OTP Email] Python interpreter: ${pythonInterpreter}`);
      
//       if (err.code === 'ENOENT') {
//         reject(new Error(
//           `Python interpreter not found: ${pythonInterpreter}. ` +
//           'Please install Python or set PYTHON_PATH environment variable. ' +
//           `Tried to execute: ${pythonInterpreter} ${scriptPath}`
//         ));
//       } else {
//         reject(new Error(`Failed to execute email script: ${err.message} (code: ${err.code})`));
//       }
//     });
//   });
// }

/**
 * Initializes the email service
 * @returns {Promise<void>}
 */
export async function initializeEmailService() {
  // Check if Python script exists
  if (!fs.existsSync(scriptPath)) {
    console.warn(`[OTP Email] ⚠️  Python script not found at: ${scriptPath}`);
    console.warn('[OTP Email]    Email service will not be available.');
    return;
  }

  // Check if email credentials are available in environment variables
  const fromEmail = process.env.GMAIL_USER;
  const fromPassword = process.env.GMAIL_APP_PASS;

  if (!fromEmail || !fromPassword) {
    console.warn('[OTP Email] ⚠️  Email credentials are not set in environment variables.');
    console.warn('[OTP Email]    Please set GMAIL_USER and GMAIL_APP_PASS.');
    console.warn('[OTP Email]    Email service will not be available until credentials are set up.');
    return;
  }

  // Detect Python interpreter
  const pythonInterpreter = await detectPythonInterpreter();
  
  // Test Python availability
  return new Promise((resolve) => {
    const testProcess = spawn(pythonInterpreter, ['--version'], {
      env: process.env,
      stdio: 'pipe'
    });

    let versionOutput = '';
    testProcess.stdout.on('data', (chunk) => {
      versionOutput += chunk.toString();
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`[OTP Email] 🔌 Email service ready (using Gmail SMTP via Python)`);
        console.log(`[OTP Email]    Python version: ${versionOutput.trim()}`);
        console.log(`[OTP Email]    Script: ${scriptPath}`);
        console.log('[OTP Email]    Mode: Gmail SMTP');
      } else {
        console.warn(`[OTP Email] ⚠️  Python not available (${pythonInterpreter}). Email service will not work.`);
        console.warn('[OTP Email]    Install Python or set PYTHON_PATH environment variable.');
      }
      resolve();
    });

    testProcess.on('error', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(`[OTP Email] ⚠️  Python interpreter not found: ${pythonInterpreter}`);
        console.warn('[OTP Email]    Install Python or set PYTHON_PATH environment variable.');
      } else {
        console.warn(`[OTP Email] ⚠️  Error checking Python: ${err.message}`);
      }
      resolve();
    });
  });
}

/**
 * Sends an OTP email to the recipient
 * @param {string} recipientEmail - The email address to send the OTP to
 * @param {string} otp - The one-time password to send
 * @returns {Promise<void>}
 */
export async function sendOtpEmail(recipientEmail, otp) {
  const startTime = Date.now();
  
  try {
    await sendOtpEmailViaSmtp(recipientEmail, otp);
    const duration = Date.now() - startTime;
    console.log(`[OTP Email] ✅ Sent successfully to ${recipientEmail}`);
    console.log(`[OTP Email] ⏱️  Total time: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[OTP Email] ❌ Failed to send to ${recipientEmail} after ${duration}ms`);
    console.error(`[OTP Email] Error: ${error.message}`);
    throw error;
  }
}
