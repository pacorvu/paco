import express from 'express';
import { 
  register,
  sendRegistrationOtp,
  login, 
  getMe, 
  forgotPassword,
  sendPasswordResetOtp,
  resetPassword 
} from '../controllers/authController.js';
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

// Auth routes (admin only - registration)
router.post('/auth/register/send-otp', protect, authorize('admin'), sendRegistrationOtp);
router.post('/auth/register', protect, authorize('admin'), register);
router.post('/auth/forgot-password/send-otp', sendPasswordResetOtp);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Auth routes (protected)
router.get('/auth/me', protect, getMe);

// Database browser routes (admin only)
router.get('/db/tables', protect, authorize('admin'), getDatabaseTables);
router.get('/db/tables/:tableName/schema', protect, authorize('admin'), getTableSchemaInfo);
router.get('/db/tables/:tableName/data', protect, authorize('admin'), getTableDataInfo);
router.post('/db/query', protect, authorize('admin'), executeCustomQuery);

// Placement dashboard routes (admin, VC, and guest)
router.get('/dashboard/placement/overall', protect, authorize('admin', 'vc', 'guest'), getOverallPlacementStats);
router.get('/dashboard/placement/by-school', protect, authorize('admin', 'vc', 'guest'), getPlacementBySchool);
router.get('/dashboard/placement/school-distribution', protect, authorize('admin', 'vc', 'guest'), getSchoolDistribution);
router.get('/dashboard/placement/ctc-distribution', protect, authorize('admin', 'vc', 'guest'), getCTCDistribution);
router.get('/dashboard/placement/hiring-partners', protect, authorize('admin', 'vc', 'guest'), getHiringPartners);
router.get('/dashboard/placement/ctc-stats', protect, authorize('admin', 'vc', 'guest'), getCTCStats);

// Example route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

export default router;

