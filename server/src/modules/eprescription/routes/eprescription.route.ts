import { Router } from 'express';
import { EprescriptionController } from '../controllers/';
import { authenticate, authorize } from '../../../middlewares';
import { createS3UploadMiddleware } from '../../../middlewares/upload.middleware';

const router = Router();
const eprescriptionController = new EprescriptionController();

// Create e-prescription
router.post(
  '/create',
  authenticate,
  createS3UploadMiddleware({ fields: [{ name: 'images', maxCount: 10 }], folder: 'eprescription-images' }),
  (req, res) => eprescriptionController.createEPrescription(req, res)
);

// Get e-prescription by PatientID
router.get('/:id', authenticate, (req, res) => eprescriptionController.getEPrescriptionByPatientId(req, res));

// Get e-prescriptions by user
router.get('/user/prescriptions', authenticate, (req, res) => eprescriptionController.getEPrescriptionsByUser(req, res));

// Update e-prescription
router.put(
  '/:id',
  authenticate,
  createS3UploadMiddleware({ fields: [{ name: 'images', maxCount: 10 }], folder: 'eprescription-images' }),
  (req, res) => eprescriptionController.updateEPrescription(req, res)
);

// Delete e-prescription
router.delete('/:id', authenticate, (req, res) => eprescriptionController.deleteEPrescription(req, res));

// Search e-prescriptions
router.get('/search/:query', authenticate, (req, res) => eprescriptionController.searchEPrescriptions(req, res));

// Get images from e-prescriptions by user
router.get('/images/:userId', authenticate, (req, res) => eprescriptionController.getImagesByUser(req, res));

// Regenerate prescription PDF
router.post('/:id/regenerate-pdf', authenticate, (req, res) => eprescriptionController.regeneratePrescriptionPDF(req, res));

export default router;
