import { Router } from 'express'
import { EmrController } from '../controllers/emr.controller'
import { authenticate, authorize } from '../../../middlewares'
import { createS3UploadMiddleware } from '../../../middlewares/upload.middleware'

const router = Router()
const emrController = new EmrController()

router.post(
  '/create',
  authenticate,
  createS3UploadMiddleware({ fields: [{ name: 'images', maxCount: 10 }], folder: 'emr-images' }),
  emrController.createEmr
)
router.get('/:userId', emrController.getEmrsByUserId)
// Generate EMR PDF by ID
router.post('/pdf/:id', authenticate, emrController.generateEmrPdfAndUpload)

export default router
