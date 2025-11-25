# Supabase Migration Guide

This guide will help you migrate from SQLite to Supabase for authentication.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be set up (takes a few minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **Service Role Key** (this is your `SUPABASE_SERVICE_ROLE_KEY` - keep this secret!)

## Step 3: Run the SQL Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `backend/supabase_migration.sql`
3. Copy and paste the entire SQL script into the SQL Editor
4. Click **Run** to execute the migration
5. Verify that the `users` table was created successfully

## Step 4: Generate Password Hashes for Default Users

The migration script includes placeholder password hashes. You need to generate proper bcrypt hashes:

### Option A: Use Node.js to generate hashes

Create a temporary file `generate-hashes.js`:

```javascript
import bcrypt from 'bcryptjs';

async function generateHashes() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const pdHash = await bcrypt.hash('pd123', 10);
  
  console.log('Admin password hash:', adminHash);
  console.log('PD password hash:', pdHash);
}

generateHashes();
```

Run it: `node generate-hashes.js`

### Option B: Update passwords after migration

You can update the default user passwords after running the migration by registering new users or using the reset password functionality.

## Step 5: Update Environment Variables

Add these to your `backend/.env` file:

```env
SUPABASE_URL=your-project-url-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRE=30d
```

**Important:** Never commit your `.env` file to version control!

## Step 6: Install Dependencies

```bash
cd backend
npm install @supabase/supabase-js
```

## Step 7: Update Your Code

The code has already been updated to use Supabase:
- `backend/database/supabase.js` - Supabase connection and helper functions
- `backend/controllers/authController.js` - Updated to use Supabase

## Step 8: Test the Migration

1. Start your backend server: `npm run dev`
2. Try registering a new user
3. Try logging in with the default admin credentials (if you updated the password hashes)

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure you've added `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file
- Restart your server after adding environment variables

### Error: "relation 'users' does not exist"
- Make sure you ran the SQL migration script in the Supabase SQL Editor
- Check that the table was created in the Supabase dashboard under **Table Editor**

### Error: "new row violates row-level security policy"
- The migration script includes RLS policies. Make sure you're using the **Service Role Key** (not the anon key) in your backend
- The Service Role Key bypasses RLS policies

### Password hashes not working
- Make sure you generated proper bcrypt hashes
- The default hashes in the migration are placeholders and won't work
- You can update them manually in the Supabase dashboard or use the registration endpoint

## Row Level Security (RLS)

The migration script enables RLS on the `users` table. The policy allows the service role to access all rows, which is appropriate for backend operations. If you need to adjust security policies, you can modify them in the Supabase dashboard under **Authentication** → **Policies**.

## Next Steps

- Consider setting up email verification if needed
- Set up password reset email functionality
- Review and adjust RLS policies based on your security requirements
- Consider using Supabase Auth for authentication instead of custom JWT (optional)

