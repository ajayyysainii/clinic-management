import { Router } from 'express';
import { authenticate, authorize } from '../../../middlewares';
import { CertificateController } from '../controllers/certificate.controller';

const router = Router();
const certificateController = new CertificateController();

// Create certificate (doctors only)
router.post(
  '/create',
  authenticate,
  authorize(['doctor', 'hybrid']),
  certificateController.createCertificate.bind(certificateController)
);

// Get all certificates (with filters)
router.get(
  '/',
  authenticate,
  authorize(['doctor', 'hybrid', 'admin', 'clinic-admin', 'clinic-head', 'staff']),
  certificateController.getCertificates.bind(certificateController)
);

// Get certificates by role (filtered based on user role)
router.get(
  '/by-role',
  authenticate,
  authorize(['doctor', 'hybrid', 'admin', 'clinic-admin', 'clinic-head', 'staff', 'patient']),
  certificateController.getCertificatesByRole.bind(certificateController)
);

// Get certificate by ID
router.get(
  '/:id',
  authenticate,
  authorize(['doctor', 'hybrid', 'admin', 'clinic-admin', 'clinic-head', 'staff', 'patient']),
  certificateController.getCertificateById.bind(certificateController)
);

// Update certificate (doctors only)
router.put(
  '/:id',
  authenticate,
  authorize(['doctor', 'hybrid']),
  certificateController.updateCertificate.bind(certificateController)
);

// Delete certificate (doctors and admins only)
router.delete(
  '/:id',
  authenticate,
  authorize(['doctor', 'hybrid', 'admin', 'clinic-admin', 'clinic-head']),
  certificateController.deleteCertificate.bind(certificateController)
);

// Download certificate PDF
router.get(
  '/:id/download',
  authenticate,
  authorize(['doctor', 'hybrid', 'admin', 'clinic-admin', 'clinic-head', 'staff', 'patient']),
  certificateController.downloadCertificate.bind(certificateController)
);

export default router;
