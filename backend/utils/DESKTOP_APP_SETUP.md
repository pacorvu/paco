# Desktop App OAuth Client Setup (REQUIRED)

## Why Desktop App Type?

The `gmail_send_otp.py` script uses `port=0` which means it picks a **random available port** each time. This is the correct approach because:

✅ Prevents "port already in use" errors  
✅ Works even if other services are using common ports  
✅ No need to configure redirect URIs manually  

**However**, this **REQUIRES** a "Desktop app" OAuth client type because:
- Desktop app type automatically allows `http://localhost` with **any port**
- Web application type requires **exact** redirect URIs to be configured
- Since the port is random, you can't predict the redirect URI for Web application type

## Setup Steps

### 1. Create Desktop App OAuth Client

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type**: Select **"Desktop app"** ⚠️
   - NOT "Web application"
   - NOT "iOS" or "Android"
   - **"Desktop app"** only
4. **Name**: `OTP Email Sender Desktop`
5. Click **"CREATE"**
6. Click **"DOWNLOAD JSON"**
7. Save as `credentials.json` in `backend/utils/` folder

### 2. Verify credentials.json

Open `backend/utils/credentials.json` and check:

**✅ CORRECT (Desktop app):**
```json
{
  "installed": {
    "client_id": "...",
    "client_secret": "...",
    ...
  }
}
```

**❌ WRONG (Web application):**
```json
{
  "web": {
    "client_id": "...",
    "client_secret": "...",
    ...
  }
}
```

If you see `"web"` instead of `"installed"`, you downloaded the wrong OAuth client type!

### 3. Configure OAuth Consent Screen

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. **User Type**: External (unless you have Google Workspace)
3. **Scopes**: Add `https://www.googleapis.com/auth/gmail.send`
4. **Test Users**: Add your email (e.g., `paco.rvu@gmail.com`)
5. Save all steps

### 4. Test

1. Delete old token (if exists):
   ```powershell
   Remove-Item backend\utils\token.json -ErrorAction SilentlyContinue
   ```

2. Run the script:
   ```powershell
   cd backend\utils
   python gmail_send_otp.py test@example.com 123456
   ```

3. Browser should open automatically
4. Complete the OAuth flow
5. No redirect_uri_mismatch errors!

## Troubleshooting

### Still Getting redirect_uri_mismatch?

- ✅ Check that your OAuth client type is "Desktop app" (not "Web application")
- ✅ Verify `credentials.json` has `"installed"` (not `"web"`)
- ✅ Make sure you're using the Desktop app credentials file
- ✅ Delete `token.json` and try again

### Port Already in Use?

- The script uses `port=0` which automatically picks a free port
- You shouldn't get this error with Desktop app type
- If you do, something else is wrong - check the error message

## Summary

**For this Python script, you MUST use Desktop app OAuth client type.**

- ✅ Desktop app = Works with random ports (`port=0`)
- ❌ Web application = Requires fixed ports and exact redirect URIs

The script is already configured correctly with `port=0`. Just make sure you're using a Desktop app OAuth client!

