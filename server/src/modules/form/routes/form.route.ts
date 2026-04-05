import { Router } from 'express';
import { authenticate, authorize } from '../../../middlewares';
import { FormController } from '../controllers';
import { CertificateController } from '../controllers/certificate.controller';

const formController = new FormController();
const certificateController = new CertificateController();
const router = Router();

// GST Form routes
router.post(
  '/gstform/:invoice_id',
  formController.createGstForm.bind(formController)
);

router.get(
  '/gst-clinic-invoices',authenticate,
  formController.getGstClinicInvoicesByClinicId.bind(formController)
);

// Referral Form routes
router.post(
  '/referral/create', authenticate, authorize(['admin', 'clinic-admin', 'clinic-head', 'doctor','hybrid']),
  formController.createReferralForm.bind(formController)
);

router.get(
  '/referral/list', authenticate, authorize(['admin', 'clinic-admin', 'clinic-head', 'doctor','hybrid', 'patient']),
  formController.getReferralFormsByRole.bind(formController)
);

router.get(
  '/referral/:id', authenticate, authorize(['admin', 'clinic-admin', 'clinic-head', 'doctor','hybrid', 'patient']),
  formController.getReferralFormById.bind(formController)
);

router.put(
  '/referral/:id', authenticate, authorize(['admin', 'clinic-admin', 'clinic-head', 'doctor','hybrid']),
  formController.updateReferralForm.bind(formController)
);

router.delete(
  '/referral/:id', authenticate, authorize(['admin', 'clinic-admin', 'clinic-head', 'doctor','hybrid']),
  formController.deleteReferralForm.bind(formController)
);

// Certificate routes
router.post(
  '/certificate/create',
  authenticate,
  authorize(['doctor', 'hybrid']),
  certificateController.createCertificate.bind(certificateController)
);

router.get(
  '/certificate/list',
  authenticate,
  authorize(['doctor', 'hybrid', 'admin', 'clinic-admin', 'clinic-head', 'staff']),
  certificateController.getCertificates.bind(certificateController)
);

router.get(
  '/certificate/by-role',
  authenticate,
  authorize(['doctor', 'hybrid', 'admin', 'clinic-admin', 'clinic-head', 'staff', 'patient']),
  certificateController.getCertificatesByRole.bind(certificateController)
);

router.get(
  '/certificate/:id',
  authenticate,
  authorize(['doctor', 'hybrid', 'admin', 'clinic-admin', 'clinic-head', 'staff', 'patient']),
  certificateController.getCertificateById.bind(certificateController)
);

router.put(
  '/certificate/:id',
  authenticate,
  authorize(['doctor', 'hybrid']),
  certificateController.updateCertificate.bind(certificateController)
);

router.delete(
  '/certificate/:id',
  authenticate,
  authorize(['doctor', 'hybrid', 'admin', 'clinic-admin', 'clinic-head']),
  certificateController.deleteCertificate.bind(certificateController)
);

router.get(
  '/certificate/:id/download',
  authenticate,
  authorize(['doctor', 'hybrid', 'admin', 'clinic-admin', 'clinic-head', 'staff', 'patient']),
  certificateController.downloadCertificate.bind(certificateController)
);

export default router;
