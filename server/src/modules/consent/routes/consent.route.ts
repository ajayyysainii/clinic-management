import { Router } from 'express';
import ConsentController from '../controllers/consent.controller';
import { authenticate } from '../../../middlewares';
import { createS3UploadMiddleware } from '../../../middlewares/upload.middleware';

const router = Router();

// @route   POST /api/consent
// @desc    Create a new consent form (Doctor only)
// @access  Private (Doctor)
router.post('/', authenticate, ConsentController.createConsentForm);

// @route   PUT /api/consent/:formId/sign
// @desc    Sign a consent form (Patient or Doctor)
// @access  Private
router.put(
  '/:formId/sign',
  authenticate,
  createS3UploadMiddleware({
    singleField: 'signatureImage',
    folder: 'consent-signatures',
  }),
  ConsentController.signConsentForm
);

// @route   GET /api/consent
// @desc    Get consent forms for the logged-in user (Doctor or Patient)
// @access  Private
router.get('/', authenticate, ConsentController.getConsentForms);

// @route   GET /api/consent/:id
// @desc    Get a specific consent form by ID
// @access  Private
router.get('/:id', authenticate, ConsentController.getConsentFormById);

// @route   GET /api/consent/:id/pdf
// @desc    Generate PDF for a consent form
// @access  Private
router.get('/:id/pdf', authenticate, ConsentController.generateConsentPdf);


export default router;

