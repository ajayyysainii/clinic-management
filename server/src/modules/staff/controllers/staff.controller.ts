import { Request, Response } from 'express'
import { StaffService } from '../services'
import { AuthenticatedRequest } from '../../../types'

export class StaffController {
  private StaffService: StaffService

  constructor() {
    this.StaffService = new StaffService()
  }

  createStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinic = req.currentUser?.clinic
      let staffData = { ...req.body, clinic }
      // Handle eSign and degrees file uploads
      const files = req.files as {
        eSign?: Express.Multer.File[]
        degrees?: Express.Multer.File[]
        profileImageUrl?: Express.Multer.File[]
      }
      // eSign
      if (files && files.eSign && files.eSign[0]) {
        staffData.eSign = (files.eSign[0] as any).location
      } else if (req.body.existingESign) {
        staffData.eSign = req.body.existingESign
      }
      // Degrees
      let degreeNames = []
      if (req.body.degreeNames) {
        if (Array.isArray(req.body.degreeNames)) {
          degreeNames = req.body.degreeNames
        } else {
          try {
            degreeNames = JSON.parse(req.body.degreeNames)
          } catch {
            degreeNames = [req.body.degreeNames]
          }
        }
      }
      const degrees: { name?: string; image_url?: string }[] = []
      if (degreeNames.length > 0) {
        for (let i = 0; i < degreeNames.length; i++) {
          let image_url = ''
          if (files && files.degrees && files.degrees[i]) {
            image_url = (files.degrees[i] as any).location
          } else if (req.body.existingDegrees && Array.isArray(req.body.existingDegrees) && req.body.existingDegrees[i]) {
            image_url = req.body.existingDegrees[i]
          } else if (req.body.existingDegrees && typeof req.body.existingDegrees === 'string') {
            // If only one degree
            image_url = req.body.existingDegrees
          }
          degrees.push({ name: degreeNames[i], image_url })
        }
        staffData.degrees = degrees
      }
      // Handle profile image upload
      if (files && files.profileImageUrl && files.profileImageUrl[0]) {
        staffData.profileImageUrl = (files.profileImageUrl[0] as any).location
      } else if (req.body.existingProfileImage) {
        staffData.profileImageUrl = req.body.existingProfileImage
      }
      const result = await this.StaffService.createStaff(staffData)
      res.status(201).json({ success: true, message: 'Staff created successfully', data: result })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to create staff' })
    }
  }

  getStaffById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinic = req.currentUser?.clinic
      const { id } = req.params
      const result = await this.StaffService.getStaffById(id)
      if (!result) {
        res.status(404).json({ success: false, error: 'Staff not found' })
        return
      }
      res.status(200).json({ success: true, data: result })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch staff' })
    }
  }

  getAllStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinic = req.currentUser?.clinic
      const result = await this.StaffService.getAllStaff(clinic)
      res.status(200).json({ success: true, data: result })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch staff list' })
    }
  }

  updateStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const updateData = req.body
      // Optionally handle file uploads for eSign or degrees here
      const result = await this.StaffService.updateStaff(id, updateData)
      if (!result) {
        res.status(404).json({ success: false, error: 'Staff not found' })
        return
      }
      res.status(200).json({ success: true, message: 'Staff updated successfully', data: result })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to update staff' })
    }
  }

  deleteStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const result = await this.StaffService.deleteStaff(id)
      if (!result) {
        res.status(404).json({ success: false, error: 'Staff not found' })
        return
      }
      res.status(200).json({ success: true, message: 'Staff deleted successfully', data: result })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to delete staff' })
    }
  }
}

export default StaffController
