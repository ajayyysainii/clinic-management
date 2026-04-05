import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();
const analyticsController = new AnalyticsController();

// New specific endpoints for better performance
router.get('/basic-stats', authenticate, analyticsController.getBasicStats);
router.get('/recent-appointments', authenticate, analyticsController.getRecentAppointments);
router.get('/alerts', authenticate, analyticsController.getSystemAlerts);

// Debug endpoint for troubleshooting
router.get('/debug', authenticate, analyticsController.debugDatabaseData);

// Legacy endpoints (keeping for backward compatibility)
router.get('/dashboard', authenticate, analyticsController.getDashboardAnalytics);
router.get('/revenue', authenticate, analyticsController.getRevenueAnalytics);
router.get('/appointments', authenticate, analyticsController.getAppointmentAnalytics);
router.get('/patients', authenticate, analyticsController.getPatientAnalytics);

export default router;
