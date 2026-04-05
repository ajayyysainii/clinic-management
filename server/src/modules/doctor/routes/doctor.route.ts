import { Router } from 'express'
import { validateDoctorRegistration } from '../validation'
import {
  registerDoctor,
  registerHybridDoctor,
  getDoctorList,
  deleteDoctor,
  updateDoctor,
  getDoctorByUserId,
  getDoctorListbyClinicId,
  listClinicDoctors,
} from '../controllers/'
import { authenticate, authorize } from '../../../middlewares'
import { createS3UploadMiddleware } from '../../../middlewares/upload.middleware'

const router = Router();

router.post(
  '/register',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head','hybrid','superadmin']),
  createS3UploadMiddleware({
    fields: [
      { name: 'eSign', maxCount: 1 },
      { name: 'certificates', maxCount: 10 },
      { name: 'degrees', maxCount: 10 },
      { name: 'profileImageUrl', maxCount: 1 },
    ],
    folder: 'doctor-files',
  }),
  registerDoctor,
)

router.post(
  '/register-hybrid',
  authenticate,
  authorize(['admin', 'hybrid','superadmin']),
  createS3UploadMiddleware({
    fields: [
      { name: 'eSign', maxCount: 1 },
      { name: 'certificates', maxCount: 10 },
      { name: 'degrees', maxCount: 10 },
    ],
    folder: 'doctor-files',
  }),
  registerHybridDoctor,
)

router.get('/list', authenticate, authorize(['admin', 'clinic-admin', 'clinic-head','doctor','hybrid','staff','superadmin']), getDoctorListbyClinicId)

router.get('/list-clinic-doctors', authenticate, authorize(['admin', 'clinic-admin', 'clinic-head','doctor','hybrid','staff','superadmin']), listClinicDoctors)

router.get('/list/:userId', authenticate, authorize(['admin', 'clinic-admin', 'clinic-head','doctor','hybrid','staff','superadmin']), getDoctorByUserId)

router.delete('/delete/:id', authenticate, authorize(['admin', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']), deleteDoctor)

router.put(
  '/update/:id',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin','doctor']),
  createS3UploadMiddleware({
    fields: [
      { name: 'eSign', maxCount: 1 },
      { name: 'certificates', maxCount: 10 },
      { name: 'degrees', maxCount: 10 },
    ],
    folder: 'doctor-files',
  }),
  updateDoctor,
)

export default router;
