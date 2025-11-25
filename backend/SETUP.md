# Backend Setup Instructions

## Quick Start Commands

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create Environment File
Create a `.env` file in the `backend` directory with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# JWT Secret (change this to a random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
```

### 3. Start Development Server
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload (nodemon)

## API Endpoints

### Health Check
- **GET** `/health` - Check server status

### Test Endpoint
- **GET** `/api/test` - Test API connection

### Users API
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com"
  }
  ```
- **PUT** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Delete user

## Project Structure

```
backend/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
├── routes/                # API route definitions
│   └── apiRoutes.js
├── controllers/           # Route handlers/controllers
│   └── userController.js
└── middleware/            # Custom middleware
    └── errorMiddleware.js
```

## Features Included

✅ Express.js server setup
✅ CORS configuration for frontend
✅ Security headers (Helmet)
✅ Request logging (Morgan)
✅ Error handling middleware
✅ Environment variable support
✅ RESTful API structure
✅ Example CRUD operations

## Next Steps

- Add database integration (MongoDB, PostgreSQL, etc.)
- Implement authentication (JWT)
- Add input validation
- Set up API documentation
- Add rate limiting
- Implement file uploads

