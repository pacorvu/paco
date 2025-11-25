# Backend API Server

Node.js Express backend server with RESTful API endpoints.

## Features

- Express.js framework
- CORS enabled for frontend communication
- Security headers with Helmet
- Request logging with Morgan
- Error handling middleware
- Environment variable configuration
- RESTful API structure

## Installation

```bash
cd backend
npm install
```

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS

## Running the Server

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Users API
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Test
- `GET /api/test` - Test API endpoint

## Project Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env                   # Environment variables
├── .env.example          # Example environment variables
├── routes/               # API routes
│   └── apiRoutes.js
├── controllers/         # Route controllers
│   └── userController.js
└── middleware/          # Custom middleware
    └── errorMiddleware.js
```

## Example API Usage

### Create User
```bash
POST http://localhost:5000/api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Get All Users
```bash
GET http://localhost:5000/api/users
```

### Get User by ID
```bash
GET http://localhost:5000/api/users/1
```

## Adding More Features

- Database integration (MongoDB, PostgreSQL, etc.)
- Authentication & Authorization (JWT)
- File upload handling
- API rate limiting
- Input validation
- API documentation (Swagger)

