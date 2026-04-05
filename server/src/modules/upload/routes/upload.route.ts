import { Router } from 'express'
import { UploadController } from '../controllers/upload.controller'
import { authenticate } from '../../../middlewares'
import { createS3UploadMiddleware } from '../../../middlewares/upload.middleware'

const router = Router()
const uploadController = new UploadController()

// Single image upload endpoint
router.post(
  '/image',
  authenticate,
  createS3UploadMiddleware({
    singleField: 'image',
    folder: 'profile-images',
  }),
  uploadController.uploadImage
)

export default router
