# Complete Setup Guide

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create `.env` file in `backend/` directory
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
```

### 3. Start Backend Server
```bash
npm run dev
```

The backend will:
- Create SQLite database at `backend/database/database.sqlite`
- Create default users:
  - **Admin**: `admin@example.com` / `admin123`
  - **VC**: `vc@example.com` / `vc123`

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Create `.env` file in `frontend/` directory (optional)
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Frontend Server
```bash
npm run dev
```

## Features Implemented

### ✅ Authentication Pages
- **Login Page** (`/login`) - User login with email and password
- **Register Page** (`/register`) - User registration with role selection
- **Forgot Password Page** (`/forgot-password`) - Password reset functionality

### ✅ Role-Based Access Control
- **Admin** - Full access including database browser and user registration
- **VC** - Dashboard access (same as admin but without registration access)

### ✅ Database Browser (Admin Only)
- View all database tables
- View table schemas
- Browse table data
- Execute custom SELECT queries
- Accessible at `/database-browser` (admin only)

### ✅ SQLite3 Database
- Database file: `backend/database/database.sqlite`
- Users table with roles
- Automatic initialization on server start

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user (protected)

### Database Browser (Admin Only)
- `GET /api/db/tables` - Get all tables
- `GET /api/db/tables/:tableName/schema` - Get table schema
- `GET /api/db/tables/:tableName/data` - Get table data
- `POST /api/db/query` - Execute SELECT query

## Default Users

1. **Admin User**
   - Email: `admin@example.com`
   - Password: `admin123`
   - Role: `admin`

2. **VC**
   - Email: `vc@example.com`
   - Password: `vc123`
   - Role: `vc`

## Project Structure

```
Pod/
├── backend/
│   ├── database/
│   │   ├── db.js              # Database setup and utilities
│   │   └── database.sqlite    # SQLite database file (created automatically)
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   └── dbBrowserController.js  # Database browser API
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT and role-based auth
│   │   └── errorMiddleware.js # Error handling
│   ├── routes/
│   │   └── apiRoutes.js       # API route definitions
│   ├── server.js              # Express server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── DatabaseBrowser.jsx
    │   ├── components/
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## Usage

1. Start both servers (backend and frontend)
2. Navigate to `http://localhost:5173`
3. Login with default credentials or register a new account
4. Admin users can access the Database Browser from the dashboard
5. All users can access their dashboard after login

## Notes

- Password reset tokens are shown in development mode (remove in production!)
- Database browser only allows SELECT queries for safety
- JWT tokens are stored in localStorage
- All API requests include authentication headers automatically

