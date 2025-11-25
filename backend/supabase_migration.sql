-- ============================================================================
-- SIMPLIFIED SUPABASE MIGRATION - 3 TABLES ONLY
-- ============================================================================
-- 1. register table - Saves user registrations
-- 2. login table - Saves login details
-- 3. otp table - Saves OTP details
-- ============================================================================

-- ============================================================================
-- 1. REGISTER TABLE
-- ============================================================================
-- Stores all user registrations with account details
-- ============================================================================

CREATE TABLE IF NOT EXISTS register (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'vc')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_register_email ON register(email);

-- ============================================================================
-- 2. LOGIN TABLE
-- ============================================================================
-- Stores all login attempts and sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS login (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  user_id BIGINT REFERENCES register(id) ON DELETE CASCADE,
  login_status TEXT NOT NULL CHECK(login_status IN ('SUCCESS', 'FAILED')),
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for login table
CREATE INDEX IF NOT EXISTS idx_login_email ON login(email);
CREATE INDEX IF NOT EXISTS idx_login_user_id ON login(user_id);
CREATE INDEX IF NOT EXISTS idx_login_status ON login(login_status);
CREATE INDEX IF NOT EXISTS idx_login_created_at ON login(created_at);

-- ============================================================================
-- 3. OTP TABLE
-- ============================================================================
-- Stores OTP requests for registration and password reset
-- ============================================================================

CREATE TABLE IF NOT EXISTS otp (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('REGISTRATION', 'PASSWORD_RESET')),
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for OTP table
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp(email);
CREATE INDEX IF NOT EXISTS idx_otp_purpose ON otp(purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_consumed ON otp(consumed_at) WHERE consumed_at IS NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Auto-update updated_at on register table
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_register_updated_at ON register;
CREATE TRIGGER update_register_updated_at 
  BEFORE UPDATE ON register 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE register ENABLE ROW LEVEL SECURITY;
ALTER TABLE login ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp ENABLE ROW LEVEL SECURITY;

-- Policies to allow service role access
DROP POLICY IF EXISTS "Service role can access register" ON register;
CREATE POLICY "Service role can access register"
  ON register FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access login" ON login;
CREATE POLICY "Service role can access login"
  ON login FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access otp" ON otp;
CREATE POLICY "Service role can access otp"
  ON otp FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created:
-- ✅ register - User registrations
-- ✅ login - Login attempts
-- ✅ otp - OTP requests
-- ============================================================================

