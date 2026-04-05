import { Router } from 'express';
import { UserController } from '../controllers';
import { validateLogin, validateChangePassword } from '../validation';
import { authenticate } from '../../../middlewares';
import { createS3UploadMiddleware } from '../../../middlewares/upload.middleware';

const router = Router()
const userController = new UserController()

router.post('/create', userController.createUser);
router.post('/login', validateLogin, userController.login);
router.get('/me',authenticate, userController.getUserInfo)
router.get('/search-by-mobile',authenticate,userController.searchByMobile)
router.get('/count-patients', authenticate, userController.countPatientsInClinic);
router.post('/change-password', authenticate, validateChangePassword, userController.changePassword);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/profile/image',
  authenticate,
  createS3UploadMiddleware({
    singleField: 'profileImage',
    folder: 'user-profiles',
  }),
  userController.updateProfileImage
);

export default router;
