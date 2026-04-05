import { Request, Response } from 'express'
import { PatientService } from '../services'
import mongoose from 'mongoose'
import { Relationship, ConsultationMode } from '../models'
import { AuthenticatedRequest } from '../../../types'
import User from '../../user/models/user.model';
import { ClinicPatient } from '../models/clinicPatient.model';

export class PatientController {
  private PatientService: PatientService

  constructor() {
    this.PatientService = new PatientService()
  }

  registerPatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        name,
        email,
        phone,
        DOB,
        triage,
        notes,
        bloodPressure,
        weight,
        height,
        relationship,
        familyMemberName,
        consultationMode,
        assignedDoctors,
        diagnosis,
        appointmentTime,
        status,
        clinicId: bodyClinicId, // allow override from formData
        gender,
        bloodGroup,
        // New health vitals
        heartRate,
        temperature,
        hba1c,
        bloodGlucose,
        spO2,
      } = req.body

      const clinicId = bodyClinicId || req.currentUser?.clinic
      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      // Handle profile image upload
      let profileImageUrl = ''
      if (req.files && (req.files as any).profileImageUrl && (req.files as any).profileImageUrl[0]) {
        profileImageUrl = (req.files as any).profileImageUrl[0].location
      } else if (req.body.existingProfileImage) {
        profileImageUrl = req.body.existingProfileImage
      }

      const patientData: any = {
        name,
        email,
        phone,
        DOB: new Date(DOB),
        triage,
        notes,
        bloodPressure,
        weight,
        height,
        relationship: relationship || Relationship.SELF,
        consultationMode: consultationMode || ConsultationMode.ONSITE,
        assignedDoctors: assignedDoctors ? JSON.parse(assignedDoctors) : undefined,
        clinicId,
        diagnosis,
        appointmentTime: appointmentTime ? new Date(appointmentTime) : new Date(),
        status,
        profileImageUrl,
        gender,
        bloodGroup,
        // New health vitals
        heartRate,
        temperature,
        hba1c,
        bloodGlucose,
        spO2,
      }

      // Only add familyMemberName if relationship is not SELF and familyMemberName is provided
      if (relationship !== Relationship.SELF && familyMemberName && familyMemberName.trim()) {
        patientData.familyMemberName = familyMemberName;
      }

      const result = await this.PatientService.registerPatient(patientData)

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: {
          result,
        },
      })
    } catch (error: any) {
      console.error('Patient registration error:', error)
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          error: 'Patient with this email already exists',
        })
        return
      }
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to register patient',
      })
    }
  }

  getPatientsByClinic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinic = req.currentUser?.clinic

      if (!clinic) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const patients = await this.PatientService.getPatientsByClinic(clinic)

      res.status(200).json({
        success: true,
        message: "Patient's list fetched successfully",
        data: patients,
        count: patients.length,
      })
    } catch (error: any) {
      console.error('Get patients error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch patient list',
      })
    }
  }

  getPatientsByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        })
        return
      }
      const patients = await this.PatientService.getPatientsByUserId(userId)

      if (!patients || patients.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No patient records found for this user',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Patient records fetched successfully',
        data: patients,
      })
    } catch (error: any) {
      console.error('Get patient records error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch patient records',
      })
    }
  }

  updatePatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const {
        name,
        email,
        phone,
        DOB,
        triage,
        notes,
        visitDates,
        bloodPressure,
        weight,
        height,
        relationship,
        familyMemberName,
        consultationMode,
        assignedDoctors,
        diagnosis,
        status,
        clinicId: bodyClinicId,
        gender,
        bloodGroup,
        // New health vitals
        heartRate,
        temperature,
        hba1c,
        bloodGlucose,
        spO2,
      } = req.body

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Valid clinic patient ID is required',
        })
        return
      }

      const clinicId = bodyClinicId || req.currentUser?.clinic
      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      // Handle profile image upload
      let profileImageUrl = ''
      if (req.files && (req.files as any).profileImageUrl && (req.files as any).profileImageUrl[0]) {
        profileImageUrl = (req.files as any).profileImageUrl[0].location
      } else if (req.body.existingProfileImage) {
        profileImageUrl = req.body.existingProfileImage
      }

      const updateData: any = {
        name,
        email,
        phone,
        DOB: DOB ? new Date(DOB) : undefined,
        triage,
        notes,
        bloodPressure,
        weight,
        height,
        relationship,
        consultationMode,
        assignedDoctors: assignedDoctors ? JSON.parse(assignedDoctors) : undefined,
        diagnosis,
        status,
        profileImageUrl,
        gender,
        bloodGroup,
        // New health vitals
        heartRate,
        temperature,
        hba1c,
        bloodGlucose,
        spO2,
      }

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      const result = await this.PatientService.updatePatient(id, clinicId, updateData)

      if (result) {
        res.status(200).json({
          success: true,
          message: 'Patient updated successfully',
          data: result,
        })
      } else {
        res.status(404).json({
          success: false,
          error: 'Patient not found',
        })
      }
    } catch (error: any) {
      console.error('Error updating patient:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      })
    }
  }

  updateHealthVitals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const {
        heartRate,
        temperature,
        hba1c,
        bloodGlucose,
        spO2,
        bloodPressure,
        weight,
        height,
      } = req.body

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Valid clinic patient ID is required',
        })
        return
      }

      const clinicId = req.currentUser?.clinic
      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      // Validate health vitals data
      const healthVitalsData: any = {}

      if (heartRate !== undefined) {
        if (heartRate < 0) {
          res.status(400).json({
            success: false,
            error: 'Heart rate cannot be negative',
          })
          return
        }
        healthVitalsData.heartRate = heartRate
      }

      if (temperature !== undefined) {
        if (temperature < 0) {
          res.status(400).json({
            success: false,
            error: 'Temperature cannot be negative',
          })
          return
        }
        healthVitalsData.temperature = temperature
      }

      if (hba1c !== undefined) {
        if (hba1c < 0) {
          res.status(400).json({
            success: false,
            error: 'HbA1c cannot be negative',
          })
          return
        }
        healthVitalsData.hba1c = hba1c
      }

      if (bloodGlucose !== undefined) {
        if (bloodGlucose < 0) {
          res.status(400).json({
            success: false,
            error: 'Blood glucose cannot be negative',
          })
          return
        }
        healthVitalsData.bloodGlucose = bloodGlucose
      }

      if (spO2 !== undefined) {
        if (spO2 < 0 || spO2 > 100) {
          res.status(400).json({
            success: false,
            error: 'SpO2 must be between 0 and 100',
          })
          return
        }
        healthVitalsData.spO2 = spO2
      }

      if (weight !== undefined) {
        if (weight < 0) {
          res.status(400).json({
            success: false,
            error: 'Weight cannot be negative',
          })
          return
        }
        healthVitalsData.weight = weight
      }

      if (height !== undefined) {
        if (height < 0) {
          res.status(400).json({
            success: false,
            error: 'Height cannot be negative',
          })
          return
        }
        healthVitalsData.height = height
      }

      if (bloodPressure !== undefined) {
        healthVitalsData.bloodPressure = bloodPressure
      }

      // Update only the clinic patient record with health vitals
      const updatedPatient = await ClinicPatient.findOneAndUpdate(
        {
          _id: id,
          clinicId: clinicId,
          deletedAt: null,
        },
        {
          $set: healthVitalsData,
        },
        {
          new: true,
          runValidators: true,
        }
      )

      if (updatedPatient) {
        res.status(200).json({
          success: true,
          message: 'Health vitals updated successfully',
          data: updatedPatient,
        })
      } else {
        res.status(404).json({
          success: false,
          error: 'Patient not found in this clinic',
        })
      }
    } catch (error: any) {
      console.error('Error updating health vitals:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      })
    }
  }

  deletePatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Valid clinic patient ID is required',
        })
        return
      }

      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const deletedPatient = await this.PatientService.deletePatient(id, clinicId)

      res.status(200).json({
        success: true,
        message: 'Patient deleted successfully',
        data: deletedPatient,
      })
    } catch (error: any) {
      console.error('Delete patient error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete patient',
      })
    }
  }


}
