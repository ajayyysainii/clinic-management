import { Request, Response } from 'express'
import { UserService } from '../services'
import { AuthenticatedRequest } from '../../../types'
import { User } from '../models'


export class UserController {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, roles, phone, clinic } = req.body

      // Validate required fields
      if (!name || !email || !password || !roles || !Array.isArray(roles)) {
        res.status(400).json({
          success: false,
          message: 'Name, email, password, and roles are required'
        })
        return
      }

      const user = await this.userService.createUser({
        name,
        email,
        password,
        roles,
        phone,
        clinic
      })

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create user'
      })
    }
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body
      const result = await this.userService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      })
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      })
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.currentUser) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.currentUser._id.toString();

      const result = await this.userService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password'
      });
    }
  };

  getUserInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.currentUser) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }

      const { password, ...userData } = req.currentUser.toObject();
      res.status(200).json({
        success: true,
        data: userData
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch user data'
      });
    }
  }

  searchByMobile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { q } = req.query;
      const clinicId = req.currentUser?.clinic;
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }
      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        });
        return;
      }
      // Find users with partial match on phone, name, or email, correct clinic
      const users = await User.find({
        clinic: clinicId,
        $or: [
          { phone: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      }).select('-password');
      if (!users || users.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No users found with this query in your clinic',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Server error',
      });
    }
  }

  countPatientsInClinic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic;
      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        });
        return;
      }
      // Count users with 'patient' role in the clinic
      const count = await User.countDocuments({
        clinic: clinicId,
        roles: 'patient',
      });
      res.status(200).json({
        success: true,
        count,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Server error',
      });
    }
  }

  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.currentUser) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }

      const { name, email, phone } = req.body;
      const userId = req.currentUser._id.toString();

      const result = await this.userService.updateProfile(userId, { name, email, phone });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  };

  updateProfileImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.currentUser) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
        return;
      }

      const userId = req.currentUser._id.toString();
      const profileImageUrl = (req.file as any).location; // S3 URL from multer-s3

      const result = await this.userService.updateProfileImage(userId, profileImageUrl);

      res.status(200).json({
        success: true,
        message: 'Profile image updated successfully',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile image'
      });
    }
  };


}
