import express from 'express';
import { 
  register,
  login, 
  getMe, 
  forgotPassword,
  sendPasswordResetOtp,
  resetPassword 
} from '../controllers/authController.js';
import {
  getUsers,
  getUserById,
  changeUserPassword
} from '../controllers/userController.js';
import {
  getDatabaseTables,
  getTableSchemaInfo,
  getTableDataInfo,
  executeCustomQuery
} from '../controllers/dbBrowserController.js';
import {
  getOverallStats,
  getCTCStats,
  getCompanyStats,
  getSchoolDistribution,
  getPlacementBySchool,
  getCompanyDetails,
  getPlacedStudents,
  getStudentDetails,
  getAllStudents
} from '../controllers/placementDashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../controllers/calendarController.js';

const router = express.Router();

// Auth routes (public)
router.post('/auth/login', login);

// Auth routes (admin and superadmin - registration, no OTP required)
router.post('/auth/register', protect, authorize('admin', 'superadmin'), register);
router.post('/auth/forgot-password/send-otp', sendPasswordResetOtp);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Auth routes (protected)
router.get('/auth/me', protect, getMe);

// Database browser routes (admin and superadmin)
router.get('/db/tables', protect, authorize('admin', 'superadmin'), getDatabaseTables);
router.get('/db/tables/:tableName/schema', protect, authorize('admin', 'superadmin'), getTableSchemaInfo);
router.get('/db/tables/:tableName/data', protect, authorize('admin', 'superadmin'), getTableDataInfo);
router.post('/db/query', protect, authorize('admin', 'superadmin'), executeCustomQuery);

// User management routes (admin and superadmin)
router.get('/users', protect, authorize('admin', 'superadmin'), getUsers);
router.get('/users/:id', protect, authorize('admin', 'superadmin'), getUserById);
router.put('/users/:id/password', protect, authorize('admin', 'superadmin'), changeUserPassword);

// Placement dashboard routes (admin and superadmin)
// Consolidated professional business module - one API per section
router.get('/dashboard/placement/overall', protect, authorize('admin', 'superadmin'), getOverallStats);
router.get('/dashboard/placement/ctc', protect, authorize('admin', 'superadmin'), getCTCStats);
router.get('/dashboard/placement/companies', protect, authorize('admin', 'superadmin'), getCompanyStats);
router.get('/dashboard/placement/schools', protect, authorize('admin', 'superadmin'), getSchoolDistribution);
router.get('/dashboard/placement/by-school', protect, authorize('admin', 'superadmin'), getPlacementBySchool);
router.get('/dashboard/placement/company/:companyName', protect, authorize('admin', 'superadmin'), getCompanyDetails);
router.get('/dashboard/placement/placed-students', protect, authorize('admin', 'superadmin'), getPlacedStudents);
router.get('/dashboard/placement/student/:usn', protect, authorize('admin', 'superadmin'), getStudentDetails);
router.get('/dashboard/students', protect, authorize('admin', 'superadmin'), getAllStudents);

// Calendar routes (admin and superadmin)
router.get('/calendar/events', protect, authorize('admin', 'superadmin'), getCalendarEvents);
router.post('/calendar/events', protect, authorize('admin', 'superadmin'), createCalendarEvent);
router.put('/calendar/events/:id', protect, authorize('admin', 'superadmin'), updateCalendarEvent);
router.delete('/calendar/events/:id', protect, authorize('admin', 'superadmin'), deleteCalendarEvent);

// Example route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

export default router;

