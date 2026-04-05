import { Router } from 'express';
import { createDepressionRiskCalculator, getAllDepressionRiskCalculator } from '../controllers/depressionRiskCalculate.controller';

const router = Router();

// Route to create a new depression risk assessment
router.post('/', createDepressionRiskCalculator);

// Route to get all depression risk assessments for a patient
router.get('/all', getAllDepressionRiskCalculator);

export default router;
