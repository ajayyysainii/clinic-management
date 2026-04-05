import { Router } from 'express';
import { DoctorDailyEarningsController } from '../controllers/doctorDailyEarnings.controller';
import { authenticate } from '../../../../middlewares';

const router = Router();
const controller = new DoctorDailyEarningsController();


// Doctor payout configuration routes
router.post('/:doctor_id/payout-config', authenticate, (req, res) => {
  controller.createDoctorPayoutConfig(req, res);
});

router.get('/payout-configs', authenticate, controller.listDoctorPayoutConfigs.bind(controller));

// Doctor earnings routes
router.get('/:doctor_id/earnings', authenticate, controller.getDoctorEarnings.bind(controller));
router.get('/:doctor_id/earnings/calculate', authenticate, controller.calculateDoctorEarnings.bind(controller));

// Get daily earnings for a specific doctor
router.get(
  '/:doctorId/:clinicId/daily-earnings',
  authenticate,
  controller.getDoctorDailyEarnings.bind(controller)
);

// Get earnings summary for a doctor
router.get(
  '/:doctorId/:clinicId/earnings-summary',
  authenticate,
  controller.getDoctorEarningsSummary.bind(controller)
);

// Get detailed daily earnings for a doctor
router.get(
  '/:doctorId/:clinicId/detailed-earnings',
  authenticate,
  controller.getDetailedDailyEarnings.bind(controller)
);

// Calculate daily earnings for a doctor
router.post(
  '/:doctorId/:clinicId/calculate-earnings',
  authenticate,
  controller.calculateDailyEarnings.bind(controller)
);

// Get all doctors' daily earnings for a clinic
router.get(
  '/clinic/:clinicId/daily-earnings',
  authenticate,
  controller.getClinicDailyEarnings.bind(controller)
);

// Manual trigger to calculate earnings for a specific date
router.post(
  '/calculate-earnings-manual',
  authenticate,
  controller.calculateEarningsManual.bind(controller)
);

export default router;
