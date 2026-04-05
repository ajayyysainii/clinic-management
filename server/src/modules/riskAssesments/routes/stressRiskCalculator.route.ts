import { Router } from 'express';
import {
  createStressRiskCalculator,
  getAllStressRiskCalculator,
} from '../controllers/stressRiskCalculate.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

// Create stress risk assessment
router.post('/create', authenticate, createStressRiskCalculator);

// Get all stress risk assessments for a patient
router.get('/get-all', authenticate, getAllStressRiskCalculator);
router.post('/get-all', authenticate, getAllStressRiskCalculator);

export default router;
