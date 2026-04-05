import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import CustomRiskAssessmentController from '../controllers/customRiskAssessment.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Form management routes
router.post('/create', CustomRiskAssessmentController.createForm);
router.get('/all', CustomRiskAssessmentController.getAllForms);
router.get('/:formId', CustomRiskAssessmentController.getFormById);
router.put('/:formId', CustomRiskAssessmentController.updateForm);
router.delete('/:formId', CustomRiskAssessmentController.deleteForm);

// Response routes
router.post('/:formId/submit', CustomRiskAssessmentController.submitResponse);
router.get('/:formId/responses', CustomRiskAssessmentController.getFormResponses);
router.get('/patient/:patientId/responses', CustomRiskAssessmentController.getPatientCustomFormResponses);

export default router;
