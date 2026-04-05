import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares';
import { TeleconsultationController } from './teleconsultation.controller';

const teleconsultationController = new TeleconsultationController();
const router = Router();

// Generate token for doctor to start teleconsultation
router.post(
  '/doctor/:appointmentId/token',authenticate,
  teleconsultationController.generateDoctorToken
);

// Generate token for patient to join teleconsultation
router.post(
  '/patient/:appointmentId/token',
  teleconsultationController.generatePatientToken
);

// Get teleconsultation session details
router.get(
  '/session/:appointmentId',authenticate,
  teleconsultationController.getSessionDetails
);

// End teleconsultation session
router.post(
  '/session/:appointmentId/end',
  authorize(['doctor', 'admin']),
  teleconsultationController.endSession
);

export default router;
