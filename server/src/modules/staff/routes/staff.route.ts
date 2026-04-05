import { Router } from 'express'
import StaffController from '../controllers/staff.controller'
import { authenticate, authorize } from '../../../middlewares/'
import { createS3UploadMiddleware } from '../../../middlewares/upload.middleware'

const router = Router()
const staffController = new StaffController()

router.post(
  '/',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head','superadmin']),
  createS3UploadMiddleware({ fields: [
    { name: 'profileImageUrl', maxCount: 1 },
    { name: 'eSign', maxCount: 1 },
    { name: 'degrees', maxCount: 10 },
  ], folder: 'staff-files' }),
  staffController.createStaff,
)

router.get(
  '/',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head','superadmin']),
  staffController.getAllStaff,
)

router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head','superadmin']),
  staffController.getStaffById,
)

router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head','superadmin']),
  createS3UploadMiddleware({ fields: [
    { name: 'profileImageUrl', maxCount: 1 },
    { name: 'eSign', maxCount: 1 },
    { name: 'degrees', maxCount: 10 },
  ], folder: 'staff-files' }),
  staffController.updateStaff,
)

router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head','superadmin']),
  staffController.deleteStaff,
)

export default router
