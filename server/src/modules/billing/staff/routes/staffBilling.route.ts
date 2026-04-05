import { Router } from 'express';
import { StaffBillingController } from '../controllers/staffBilling.controller';
import { authenticate } from '../../../../middlewares/auth.middleware';

const router = Router();
const controller = new StaffBillingController();

// Example route
router.get('/example', authenticate, controller.exampleMethod);

// Staff payout config routes
router.post('/:staff_id/payout-config', authenticate, controller.createStaffPayoutConfig);
router.get('/payout-configs', authenticate, controller.listStaffPayoutConfigs);

export default router;
