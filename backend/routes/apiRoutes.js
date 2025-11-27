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
  getOverallPlacementStats,
  getPlacementBySchool,
  getSchoolDistribution,
  getCTCDistribution,
  getHiringPartners,
  getCTCStats
} from '../controllers/placementDashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

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
router.get('/dashboard/placement/overall', protect, authorize('admin', 'superadmin'), getOverallPlacementStats);
router.get('/dashboard/placement/by-school', protect, authorize('admin', 'superadmin'), getPlacementBySchool);
router.get('/dashboard/placement/school-distribution', protect, authorize('admin', 'superadmin'), getSchoolDistribution);
router.get('/dashboard/placement/ctc-distribution', protect, authorize('admin', 'superadmin'), getCTCDistribution);
router.get('/dashboard/placement/hiring-partners', protect, authorize('admin', 'superadmin'), getHiringPartners);
router.get('/dashboard/placement/ctc-stats', protect, authorize('admin', 'superadmin'), getCTCStats);

// Example route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

export default router;

