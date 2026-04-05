import { Response } from 'express'
import { AuthenticatedRequest } from '../../../types'

export class UploadController {
  uploadImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const imageUrl = (req.file as any).location; // S3 URL from multer-s3

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: imageUrl
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to upload image'
      });
    }
  };
}
