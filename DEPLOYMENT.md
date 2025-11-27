# Deployment Guide - Single URL Setup

This guide explains how to serve the frontend build from the backend, so everything runs on a single URL.

## How It Works

- **Development**: Frontend runs on Vite dev server (port 5173), backend on port 5000
- **Production**: Backend serves the frontend build files and handles all routes

## Setup Instructions

### 1. Build the Frontend

First, build the frontend for production:

```bash
cd frontend
npm run build
```

This creates a `dist` folder in the `frontend` directory with optimized production files.

### 2. Set Production Mode

Set the `NODE_ENV` environment variable to `production`:

**Windows (PowerShell):**
```powershell
$env:NODE_ENV="production"
```

**Windows (CMD):**
```cmd
set NODE_ENV=production
```

**Linux/Mac:**
```bash
export NODE_ENV=production
```

### 3. Start the Backend Server

```bash
cd backend
npm start
```

The server will:
- Serve API routes at `/api/*`
- Serve static frontend files for all other routes
- Handle client-side routing (React Router)

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

All routes (frontend pages and API endpoints) will be available from this single URL.

## Development Mode

For development, run both servers separately:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will proxy API requests to the backend automatically.

## Production Deployment

For production deployment:

1. Build the frontend: `cd frontend && npm run build`
2. Set `NODE_ENV=production`
3. **Configure Email Service** (Required for OTP functionality)
   - See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for detailed instructions
   - **For Render/Cloud Platforms**: Use Resend API (Gmail SMTP won't work)
   - Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` environment variables
4. Start the backend: `cd backend && npm start`
5. Configure your reverse proxy (nginx, etc.) to point to port 5000

### Render Deployment

When deploying to Render:

1. **Email Configuration** (Critical):
   - Cloud platforms block SMTP ports, so Gmail SMTP will NOT work
   - You MUST use Resend API for email functionality
   - Add these environment variables in Render dashboard:
     ```
     RESEND_API_KEY=re_your_api_key_here
     RESEND_FROM_EMAIL=noreply@yourdomain.com
     ```
   - See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for complete setup instructions

2. **Port Configuration**:
   - Render automatically sets the `PORT` environment variable
   - Your server should use `process.env.PORT || 5000` (already configured)

3. **Build Command**:
   ```
   cd backend && npm install && cd ../frontend && npm install && npm run build
   ```

4. **Start Command**:
   ```
   cd backend && npm start
   ```

## Notes

- The frontend API configuration automatically uses relative paths (`/api`) in production
- In development, it uses the full URL (`http://localhost:5000/api`)
- Make sure the `frontend/dist` folder exists before starting the server in production mode
- Client-side routing (React Router) will work correctly as all non-API routes serve `index.html`

