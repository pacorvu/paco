import { getSupabaseClient } from '../database/supabase.js';
import { sendOtpEmail } from './emailService.js';

const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES ?? '10', 10);

/**
 * Generates a numeric OTP of specified length
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} Generated OTP
 */
function generateNumericOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Creates an OTP challenge and sends it via email
 * @param {Object} params - OTP challenge parameters
 * @param {string} params.email - Email address to send OTP to
 * @param {string} params.purpose - Purpose of OTP (REGISTRATION, PASSWORD_RESET)
 * @param {number} [params.loginId] - Optional login ID for password reset
 * @returns {Promise<Object>} Returns { requestId, expiresAt }
 */
export async function createOtpChallenge({ email, purpose, loginId }) {
  const normalizedPurpose = purpose.toUpperCase();
  const otpValue = generateNumericOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  try {
    const supabase = getSupabaseClient();
    
    // Delete any existing unconsumed OTPs for this email and purpose using Supabase directly
    const { error: deleteError } = await supabase
      .from('otp')
      .delete()
      .eq('email', email)
      .eq('purpose', normalizedPurpose)
      .is('consumed_at', null);
    
    // Ignore delete errors (might not exist)
    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('[OTP Service] Warning deleting existing OTPs:', deleteError.message);
    }
    
    // Insert new OTP request using Supabase directly
    const { data, error } = await supabase
      .from('otp')
      .insert({
        email: email,
        purpose: normalizedPurpose,
        otp_code: otpValue,
        expires_at: expiresAt.toISOString(),
        consumed_at: null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create OTP: ${error.message}`);
    }

    const requestId = data.id;

    // Send OTP via email
    try {
      await sendOtpEmail(email, otpValue);
    } catch (emailError) {
      console.error('[OTP Service] Failed to send OTP email:', emailError);
      throw new Error('Failed to send OTP email. Please try again.');
    }

    return { 
      requestId, 
      expiresAt: expiresAt.toISOString(),
      expiresInMinutes: OTP_TTL_MINUTES
    };
  } catch (error) {
    console.error('[OTP Service] Error creating OTP challenge:', error);
    throw error;
  }
}

/**
 * Verifies an OTP challenge
 * @param {Object} params - OTP verification parameters
 * @param {number} params.requestId - OTP request ID
 * @param {string} params.otp - OTP code to verify
 * @param {string} params.expectedPurpose - Expected purpose (REGISTRATION, PASSWORD_RESET)
 * @returns {Promise<Object>} Returns { email, loginId? }
 */
export async function verifyOtpChallenge({ requestId, otp, expectedPurpose }) {
  const normalizedPurpose = expectedPurpose.toUpperCase();

  try {
    const supabase = getSupabaseClient();
    
    // Get OTP request using Supabase directly
    const { data: record, error: fetchError } = await supabase
      .from('otp')
      .select('id, email, purpose, otp_code, expires_at, consumed_at')
      .eq('id', requestId)
      .single();

    if (fetchError || !record) {
      throw new Error('OTP request not found. Please request a new code.');
    }

    if (record.purpose !== normalizedPurpose) {
      throw new Error('OTP purpose mismatch.');
    }

    if (record.consumed_at) {
      throw new Error('OTP has already been used. Please request a new code.');
    }

    // Check expiration
    const expiresAt = new Date(record.expires_at);
    if (expiresAt < new Date()) {
      throw new Error('OTP has expired. Please request a new code.');
    }

    // Verify OTP code
    const isMatch = typeof record.otp_code === 'string' && 
                   record.otp_code.trim() === otp.trim();

    if (!isMatch) {
      throw new Error('Invalid OTP. Please try again.');
    }

    // Mark OTP as consumed
    const { error: updateError } = await supabase
      .from('otp')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', record.id);

    if (updateError) {
      throw new Error(`Failed to mark OTP as consumed: ${updateError.message}`);
    }

    return {
      email: record.email,
    };
  } catch (error) {
    console.error('[OTP Service] Error verifying OTP challenge:', error);
    throw error;
  }
}

