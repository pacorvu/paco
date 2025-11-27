# Fix: Port Already in Use Error

## Error Message
```
OSError: [WinError 10048] Only one usage of each socket address (protocol/network address/port) is normally permitted
```

## What This Means
Port 8080 (or whatever port the script is trying to use) is already being used by another application.

## Solution 1: Use a Different Port (Easiest)

The script has been updated to use port **8081** instead of 8080.

**Update Google Cloud Console:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth client
3. Under "Authorized redirect URIs", add:
   ```
   http://localhost:8081/
   http://127.0.0.1:8081/
   ```
4. Click "SAVE"

**Then try running the script again:**
```powershell
python gmail_send_otp.py test@example.com 123456
```

## Solution 2: Find and Stop What's Using Port 8080

If you want to free up port 8080:

1. **Find what's using the port:**
   ```powershell
   netstat -ano | findstr :8080
   ```
   This will show the Process ID (PID) using the port.

2. **Stop the process:**
   ```powershell
   taskkill /PID <PID_NUMBER> /F
   ```
   Replace `<PID_NUMBER>` with the actual PID from step 1.

3. **Then update the script back to port 8080** if you prefer.

## Solution 3: Use Desktop App Type (No Port Issues)

**Best solution:** Use Desktop app OAuth client type, which doesn't require a fixed port:

1. Create a new OAuth client with type "Desktop app"
2. Desktop app automatically allows `http://localhost` with any port
3. Change the script back to `port=0` (random port)
4. No redirect URI configuration needed!

## Check Available Ports

To find an available port:
```powershell
netstat -ano | findstr :8081
netstat -ano | findstr :8082
netstat -ano | findstr :3000
```

If the command returns nothing, that port is available.

