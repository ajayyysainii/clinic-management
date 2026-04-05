import { Router } from 'express'
import { authenticate, authorize } from '../../../middlewares/'
import { ClinicController } from '../controllers'
import { validateClinicRegistration } from '../validation'
import { createS3UploadMiddleware } from '../../../middlewares/upload.middleware'

const router = Router()
const clinicController = new ClinicController()

const uploadMiddleware = createS3UploadMiddleware({
  fields: [
    { name: 'logo', maxCount: 1 },
    { name: 'eSign', maxCount: 1 },
    { name: 'doctor[eSign]', maxCount: 1 },
    { name: 'doctor[degrees]', maxCount: 10 },
    { name: 'doctor[certificates]', maxCount: 10 },
    { name: 'doctor[profileImageUrl]', maxCount: 1 },
  ],
  folder: 'clinics',
})

router.post('/register', authenticate, authorize(['admin','superadmin']), uploadMiddleware, validateClinicRegistration, clinicController.registerClinic)

router.get('/:id', authenticate, authorize(['admin','superadmin','hybrid']), clinicController.getClinicById)

router.put('/', authenticate, authorize(['admin','superadmin','clinic-admin','clinic-head','hybrid']), uploadMiddleware, clinicController.updateClinic)

export default router
