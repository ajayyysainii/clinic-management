import { Router } from 'express';
import { createLiverRiskCalculator, getAllLiverRiskCalculator } from '../controllers/liverRiskCalculator.controller';

const router = Router();

// Route to create a new liver risk assessment
router.post('/', createLiverRiskCalculator);

// Route to get all liver risk assessments for a patient
router.post('/all', getAllLiverRiskCalculator);

export default router;
