import { Router } from 'express'
import { PatientController } from '../controllers'
import { authenticate, authorize } from '../../../middlewares/'
import { createS3UploadMiddleware } from '../../../middlewares/upload.middleware'

const router = Router()
const patientController = new PatientController()

router.post(
  '/register',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  createS3UploadMiddleware({
    fields: [
      { name: 'profileImageUrl', maxCount: 1 },
    ],
    folder: 'patient-files',
  }),
  patientController.registerPatient,
)
router.get(
  '/',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  patientController.getPatientsByClinic,
)

router.get(
  '/:userId',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  patientController.getPatientsByUserId,
)
router.put(
  '/update/:id',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  createS3UploadMiddleware({
    fields: [
      { name: 'profileImageUrl', maxCount: 1 },
    ],
    folder: 'patient-files',
  }),
  patientController.updatePatient,
)

router.put(
  '/health-vitals/:id',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  patientController.updateHealthVitals,
)

router.delete(
  '/delete/:id',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  patientController.deletePatient,
)

export default router
