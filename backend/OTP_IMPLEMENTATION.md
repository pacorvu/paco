# OTP Implementation Guide

## Overview
OTP (One-Time Password) service has been implemented for registration and password reset flows using Nodemailer for email delivery.

## Backend Implementation

### Files Created/Modified

1. **`backend/services/emailService.js`** - Nodemailer email service
   - Handles SMTP connection with connection pooling
   - Sends OTP emails
   - Initializes on server startup

2. **`backend/services/otpService.js`** - OTP challenge management
   - Creates OTP challenges
   - Verifies OTP codes
   - Manages OTP expiration

3. **`backend/controllers/authController.js`** - Updated auth endpoints
   - `POST /api/auth/register/send-otp` - Send OTP for registration
   - `POST /api/auth/register` - Register with OTP verification
   - `POST /api/auth/forgot-password/send-otp` - Send OTP for password reset
   - `POST /api/auth/reset-password` - Reset password with OTP verification

4. **`backend/supabase_migration.sql`** - Added `otp_requests` table

### Environment Variables Required

Add these to your `backend/.env` file:

```env
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASS=your-app-password

# Optional SMTP Configuration (defaults to Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# OTP Configuration (optional, defaults to 10 minutes)
OTP_TTL_MINUTES=10
```

### Getting Gmail App Password

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Use this password in `GMAIL_APP_PASS`

## Frontend Implementation

### Updated Files

1. **`frontend/src/context/AuthContext.jsx`**
   - Added `sendRegistrationOtp()` function
   - Updated `register()` to accept OTP parameters
   - Added `sendPasswordResetOtp()` function
   - Updated `resetPassword()` to use OTP instead of token

### Registration Flow

1. User fills registration form
2. User clicks "Send OTP" button
3. OTP is sent to user's email
4. User enters OTP
5. User submits registration with OTP
6. Account is created

### Password Reset Flow

1. User enters email on forgot password page
2. User clicks "Send OTP" button
3. OTP is sent to user's email
4. User enters OTP and new password
5. Password is reset

## API Endpoints

### Send Registration OTP
```
POST /api/auth/register/send-otp
Body: { email: "user@example.com" }
Response: { 
  success: true, 
  requestId: 123, 
  expiresInMinutes: 10,
  message: "OTP sent to your email"
}
```

### Register with OTP
```
POST /api/auth/register
Body: { 
  name: "John Doe",
  email: "user@example.com",
  password: "password123",
  role: "vc",
  otpRequestId: 123,
  otp: "123456"
}
Response: { 
  success: true, 
  token: "jwt-token",
  user: { ... }
}
```

### Send Password Reset OTP
```
POST /api/auth/forgot-password/send-otp
Body: { email: "user@example.com" }
Response: { 
  success: true, 
  requestId: 123, 
  expiresInMinutes: 10,
  message: "OTP sent to your email"
}
```

### Reset Password with OTP
```
POST /api/auth/reset-password
Body: { 
  otpRequestId: 123,
  otp: "123456",
  password: "newpassword123"
}
Response: { 
  success: true, 
  message: "Password reset successfully"
}
```

## Database Schema

The `otp_requests` table stores OTP challenges:

```sql
CREATE TABLE otp_requests (
  id BIGSERIAL PRIMARY KEY,
  email_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('REGISTRATION', 'PASSWORD_RESET')),
  otp_code TEXT NOT NULL,
  login_id BIGINT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

1. Install dependencies: `npm install` in backend directory
2. Set up environment variables in `.env`
3. Run Supabase migration to create `otp_requests` table
4. Start server: `npm run dev`
5. Test registration flow:
   - Send OTP to email
   - Verify OTP is received
   - Complete registration with OTP

## Notes

- OTPs expire after 10 minutes (configurable via `OTP_TTL_MINUTES`)
- Each OTP can only be used once
- Old unconsumed OTPs are deleted when a new one is requested
- Email service initializes on server startup for better performance
- Connection pooling is used for SMTP connections

