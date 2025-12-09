# Redirect URI Configuration Guide

## Your Actual Redirect URI

When using the Gmail OAuth script, the redirect URI format is:

```
http://localhost:8081/
```

**OR**

```
http://127.0.0.1:8081/
```

**Note:** If port 8081 is also in use, the script may need to be updated to use a different port (like 8082, 3000, etc.)

## How to Add This to Google Cloud Console

### Step 1: Go to Your OAuth Client
1. Visit: https://console.cloud.google.com/apis/credentials
2. Find your OAuth client with ID: `878333510398-bjq095evut9s0tq1hd7jjtg6bfl68n1u.apps.googleusercontent.com`
3. **Click on it** to edit

### Step 2: Add Authorized Redirect URIs
1. Scroll down to **"Authorized redirect URIs"** section
2. Click **"+ ADD URI"** button
3. Add these **exact** URIs (one per line):

```
http://localhost:8081/
http://127.0.0.1:8081/
```

**Note:** If you get a "port already in use" error, check what port the script is using and update these URIs accordingly.

**⚠️ IMPORTANT - Must Match Exactly:**
- Use `http://` (NOT `https://`)
- Use `localhost` or `127.0.0.1`
- Include the port `:8080`
- Include the trailing slash `/` at the end
- No query parameters

### Step 3: Save
1. Click **"SAVE"** at the bottom
2. Wait a few seconds for changes to propagate

### Step 4: Test
1. Delete old token:
   ```powershell
   Remove-Item backend\utils\token.json -ErrorAction SilentlyContinue
   ```
2. Try sending an OTP email again
3. The browser should open and authorization should work!

---

## Alternative: Use Desktop App Type (Easier!)

**Instead of configuring redirect URIs**, you can:

1. **Create a NEW OAuth client** with type **"Desktop app"**
2. Desktop app type **automatically allows** `http://localhost` with **any port**
3. No redirect URI configuration needed!

**Steps:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type**: Select **"Desktop app"**
4. **Name**: `OTP Email Sender Desktop`
5. Click **"CREATE"**
6. Download the new `credentials.json`
7. Replace `backend/utils/credentials.json` with the new one
8. Delete `backend/utils/token.json`
9. Try again - no redirect URI configuration needed!

---

## Why Port 8080?

The Python script (`gmail_send_otp.py`) has been updated to use port `8080` instead of a random port. This allows you to:
- Predict the redirect URI
- Add it to Google Cloud Console
- Make it work with "Web application" type OAuth clients

If you want to use a different port, you can:
1. Edit `backend/utils/gmail_send_otp.py`
2. Change `port=8080` to your desired port (e.g., `port=3000`)
3. Add `http://localhost:YOUR_PORT/` to redirect URIs in Google Cloud Console

