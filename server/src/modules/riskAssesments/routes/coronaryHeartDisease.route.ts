import { Router } from 'express';
import { createCoronaryHeartDisease } from '../controllers/coronaryHeartDisease.controller';

const router = Router();

// Route to create a new coronary heart disease assessment
router.post('/create', createCoronaryHeartDisease);

export default router;
