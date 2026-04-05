import { Router } from 'express';
import {
  createDiabeticRiskCalculator,
  getAllDiabeticRiskCalculatorDateAndRisk,
  updateSampleRecommendation,
} from '../controllers/diabeticRiskCalculator.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

// Create diabetic risk assessment
router.post('/create',  createDiabeticRiskCalculator);

// Get all diabetic risk assessments for a patient
router.post('/get-all', getAllDiabeticRiskCalculatorDateAndRisk);

// Update sample recommendations (admin route)
router.post('/update-recommendations', updateSampleRecommendation);

export default router;
