import { Router } from 'express';
import {
  createStrokeRiskCalculator,
  getAllStrokeRiskCalculatorDateAndLowerHigherVal,
} from '../controllers/strokeRiskCalculate.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

// Create stroke risk assessment
router.post('/create', createStrokeRiskCalculator);

// Get all stroke risk assessments for a patient
router.post('/get-all', getAllStrokeRiskCalculatorDateAndLowerHigherVal);

export default router;
