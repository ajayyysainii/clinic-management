import { Request, Response } from 'express'
import { ClinicService } from '../services'
import { AuthenticatedRequest } from '../../../types'

export class ClinicController {
  private clinicService: ClinicService

  constructor() {
    this.clinicService = new ClinicService()
  }

  registerClinic = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.clinicService.registerClinic(
        req.body,
        req.files,
      )

      res.status(201).json({
        success: true,
        message: 'Clinic registered successfully',
        data: {
          clinic: result.clinic,
          user: {
            name: result.user.name,
            email: result.user.email,
            roles: result.user.roles,
          },
          doctor: result.doctor,
          googleFormLink: result.clinic.googleFormLink,
        },
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to register clinic',
      })
    }
  }

  getClinicById = async (req: Request, res: Response): Promise<void> => {
    try {
      const clinic = await this.clinicService.getClinicById(req.params.id);
      if (!clinic) {
        res.status(404).json({ success: false, message: 'Clinic not found' });
        return;
      }
      res.status(200).json({
        success: true,
        data: {
          ...clinic.toObject(),
          googleFormLink: clinic.googleFormLink
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch clinic' });
    }
  }

  updateClinic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.currentUser?.clinic) {
        res.status(400).json({
          success: false,
          message: 'User not associated with any clinic',
        });
        return;
      }

      const clinicId = req.currentUser.clinic;
      const clinic = await this.clinicService.updateClinic(
        clinicId,
        req.body,
        req.files as { logo?: Express.Multer.File[]; eSign?: Express.Multer.File[] },
      );

      res.status(200).json({
        success: true,
        message: 'Clinic updated successfully',
        data: clinic,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update clinic',
      });
    }
  }
}
