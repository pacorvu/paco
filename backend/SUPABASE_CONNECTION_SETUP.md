# Supabase Connection Setup Guide

## Environment Variables Required

Add these to your `backend/.env` file:

```env
# Supabase Connection
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Database URL (if you need direct PostgreSQL connection)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRE=30d

# Email Configuration (for OTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# OTP Configuration (optional)
OTP_TTL_MINUTES=10
```

## How to Get Supabase Credentials

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Select your project**
3. **Go to Settings → API**
4. **Copy the following:**
   - **Project URL** → This is your `SUPABASE_URL`
   - **Service Role Key** → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Important Notes

- **SUPABASE_URL**: Your project's API URL (e.g., `https://abcdefghijklmnop.supabase.co`)
- **SUPABASE_SERVICE_ROLE_KEY**: Required for backend operations. This key bypasses Row Level Security (RLS)
- **DATABASE_URL**: Optional. Only needed if you want direct PostgreSQL connection. The Supabase client uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

## Database Tables

After running the migration, you'll have 3 tables:

1. **`register`** - User registrations (name, email, password, role)
2. **`login`** - Login attempts tracking (email, status, IP, user agent)
3. **`otp`** - OTP requests (email, purpose, code, expiration)

## Running the Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `backend/supabase_migration.sql`
3. Paste and run in SQL Editor
4. Verify tables were created

## Testing the Connection

After setting up environment variables:

```bash
cd backend
npm install
npm run dev
```

You should see:
- ✅ Connected to SQLite database (if using fallback)
- Or connection to Supabase should work automatically

## Troubleshooting

### Error: "Missing SUPABASE_URL"
- Make sure `SUPABASE_URL` is set in `.env` file
- Restart the server after adding environment variables

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"
- Get the Service Role Key from Supabase Dashboard → Settings → API
- Add it to your `.env` file as `SUPABASE_SERVICE_ROLE_KEY`
- **Never commit this key to version control!**

### Error: "relation 'register' does not exist"
- Run the migration script in Supabase SQL Editor
- Check that all 3 tables were created successfully

### Error: "new row violates row-level security policy"
- Make sure you're using the **Service Role Key** (not the anon key)
- The Service Role Key bypasses RLS policies

