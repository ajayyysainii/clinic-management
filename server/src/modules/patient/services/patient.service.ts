import mongoose from 'mongoose'
import { sendEmail } from '../../../utils/emailClient'
import { User } from '../../user/models'
import { hashPassword, randomPassword } from '../../../utils/password'
import {
  triage,
  IClinicPatient,
  ClinicPatient,
  Relationship,
  ConsultationMode,
  Status,
  IPatientVisitDoctors,
  PatientVisitDoctors,
} from '../models'
import {Gender,BloodGroup} from '../../user/models'
import { NotificationService } from '../../notification/services/notification.service'

interface PatientData {
  name: string
  email: string
  phone?: string
  DOB: Date
  triage: triage
  notes?: string
  bloodPressure?: string
  weight?: number
  height?: number
  relationship: Relationship
  familyMemberName?: string
  consultationMode: ConsultationMode
  status: Status
  clinicId: mongoose.Types.ObjectId
  visitDates?: Date[]
  assignedDoctors?: Array<{
    doctorId?: string // or doctorName?: string;
    appointmentTime?: Date
    consultationMode?: ConsultationMode
    status?: Status
    diagnosis?: string
  }>
  diagnosis?: string
  appointmentTime?: Date
  gender?: Gender
  bloodGroup?: BloodGroup
  // Add new health vitals
  heartRate?: number
  temperature?: number
  hba1c?: number
  bloodGlucose?: number
  spO2?: number
}

export class PatientService {
  private notificationService: NotificationService

  constructor() {
    this.notificationService = new NotificationService()
  }

  async registerPatient(data: PatientData & { profileImageUrl?: string }): Promise<any> {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const existingUser = await User.findOne({
        phone: data.phone,
        deletedAt: null,
      }).session(session)

      let user
      let isNewUser = false

      if (existingUser) {
        user = existingUser
        const existingPatient = await ClinicPatient.findOne({
          userId: user._id,
          clinicId: data.clinicId,
          deletedAt: null,
        }).session(session)

        if (existingPatient && data.relationship === Relationship.SELF) {
          throw new Error('Patient already registered in this clinic')
        }
      } else {
        const tempPassword = randomPassword()
        const hashedPassword = await hashPassword(tempPassword)

        user = new User({
          name: data.name,
          email: data.email,
          phone: data.phone,
          clinic: data.clinicId,
          password: hashedPassword,
          roles: ['patient'],
          gender: data.gender,
          bloodGroup: data.bloodGroup,
          profileImageUrl: data.profileImageUrl || '',
        })

        await user.save({ session })
        isNewUser = true

        const subject = 'Welcome to Our Clinic'
        const html = `<!DOCTYPE html><html><body>
        <p>Welcome ${user.name}!</p>
        <p>Your patient account has been created. Your login credentials are</p>
        <p>Email: ${user.email}</p>
        <p>Temporary password: ${tempPassword}</p>
      </body></html>`

        await sendEmail(process.env.ADMIN_EMAIL!, user.email, subject, html)
      }

      // If profileImageUrl is provided and user exists, update it
      if (data.profileImageUrl && user && user.profileImageUrl !== data.profileImageUrl) {
        user.profileImageUrl = data.profileImageUrl
        await user.save({ session })
      }

      // Create ClinicPatient record
      const clinicPatientData: any = {
        clinicId: data.clinicId,
        userId: user._id,
        DOB: data.DOB,
        triage: data.triage,
        consultationMode: data.consultationMode, // Default consultation mode
        visitDates: data.visitDates || [data.appointmentTime || new Date()],
        bloodPressure: data.bloodPressure,
        weight: data.weight,
        height: data.height,
        notes: data.notes,
        heartRate: data.heartRate,
        temperature: data.temperature,
        hba1c: data.hba1c,
        bloodGlucose: data.bloodGlucose,
        spO2: data.spO2,
        relationship: data.relationship,
        assignedDoctors: [],
      }

      // Only add familyMemberName if relationship is not SELF and familyMemberName is provided
      if (data.relationship !== Relationship.SELF && data.familyMemberName && data.familyMemberName.trim()) {
        clinicPatientData.familyMemberName = data.familyMemberName;
      }

      const clinicPatient = new ClinicPatient(clinicPatientData)

      const savedClinicPatient = await clinicPatient.save({ session })

      // Create PatientVisitDoctors records for each assigned doctor
      const patientVisits = []
      if (data.assignedDoctors && data.assignedDoctors.length > 0) {
        // Ensure we have individual doctor data (appointmentTime, consultationMode, status, diagnosis)
        // If not provided, use the default values from patient data
        for (const doctorData of data.assignedDoctors) {
          // Find doctor by name or ID (adjust based on your input structure)
          const doctor = await User.findOne({
            $or: [
              { name: user.name, deletedAt: null },
              { _id: doctorData.doctorId, deletedAt: null },
            ],
          }).session(session)

          if (!doctor) {
            throw new Error(`Doctor ${user.name || doctorData.doctorId} not found`)
          }

          const visit = new PatientVisitDoctors({
            clinicPatientId: savedClinicPatient._id,
            doctorId: doctor._id,
            appointmentTime: doctorData.appointmentTime || data.appointmentTime || new Date(),
            consultationMode: doctorData.consultationMode || data.consultationMode,
            status: doctorData.status || data.status || Status.PENDING,
            diagnosis: doctorData.diagnosis || data.diagnosis,
          })

          const savedVisit = await visit.save({ session })
          patientVisits.push(savedVisit)

          // Add to assignedDoctors array in ClinicPatient
          savedClinicPatient.assignedDoctors.push(doctor._id.toString())
          // Add visit date if not already present
          if (doctorData.appointmentTime && !savedClinicPatient.visitDates.includes(doctorData.appointmentTime)) {
            savedClinicPatient.visitDates.push(doctorData.appointmentTime)
          }
        }

        // Save the updated ClinicPatient with doctor IDs and visit dates
        await savedClinicPatient.save({ session })
      }

      if (data.assignedDoctors && data.assignedDoctors.length > 0) {
        const notificationPromises = data.assignedDoctors
          .filter(doctorData => doctorData.doctorId) // Filter out undefined doctorIds
          .map(async (doctorData) => {
            return this.notificationService.createNotification({
              userId: doctorData.doctorId!,
              title: 'New Patient Appointment',
              message: `A new patient ${data.name} wants to consult with you. You can contact patient on ${user.phone}`,
              type: 'appointment',
              metadata: {
                patientName: data.name,
                patientPhone: user.phone,
                appointmentTime: doctorData.appointmentTime || data.appointmentTime,
                consultationMode: doctorData.consultationMode || data.consultationMode,
                status: 'new'
              }
            })
          })

        await Promise.all(notificationPromises)
      }

      // Notify admin users about new patient registration
      const adminUsers = await User.find({
        clinic: data.clinicId,
        roles: { $in: ['admin', 'clinic-admin', 'clinic-head'] },
        deletedAt: null
      })

      const adminNotifications = adminUsers.map(adminUser => ({
        userId: adminUser._id.toString(),
        title: 'New Patient Registered',
        message: `A new patient ${data.name} has been registered in your clinic`,
        type: 'patient',
        metadata: {
          patientName: data.name,
          patientPhone: user.phone,
          patientEmail: user.email,
          registrationDate: new Date(),
          status: 'registered'
        }
      }))

      if (adminNotifications.length > 0) {
        await this.notificationService.createBulkNotifications(adminNotifications)
      }

      await session.commitTransaction()

      return {
        user: user.toObject(),
        clinicPatient: savedClinicPatient.toObject(),
        patientVisits: patientVisits.map((v) => v.toObject()),
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  async getPatientsByClinic(clinicId: mongoose.Types.ObjectId): Promise<any[]> {
    try {
      const patients = await ClinicPatient.find({
        clinicId: clinicId,
        deletedAt: null,
      })
        .populate('userId')
        .select('-deletedAt')

      return patients
    } catch (error) {
      throw error
    }
  }

  async getPatientsByUserId(userId: string): Promise<any[]> {
    try {
      return await ClinicPatient.find({
        $or: [
          { userId: userId, deletedAt: null },
          { 'userId._id': userId, deletedAt: null },
        ],
      })
        .populate('userId')
        .select('-deletedAt')
        .sort({ createdAt: -1 })
    } catch (error) {
      console.error(`Error fetching patient records for user ${userId}:`, error)
      throw new Error('Failed to fetch patient records from database')
    }
  }

  async updatePatient(
    clinicPatientId: string,
    clinicId: mongoose.Types.ObjectId,
    updateData: Partial<PatientData> & { profileImageUrl?: string },
  ): Promise<any | null> {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      if (!mongoose.Types.ObjectId.isValid(clinicPatientId)) {
        throw new Error('Invalid clinic patient ID format')
      }

      const clinicPatient = await ClinicPatient.findOne({
        _id: clinicPatientId,
        clinicId: clinicId,
        deletedAt: null,
      }).session(session)

      if (!clinicPatient) {
        throw new Error('Patient not found in this clinic')
      }

      // Define field mappings
      const userFields = new Set(['name', 'email', 'phone'])
      const clinicPatientFields = new Set([
        'DOB',
        'triage',
        'consultationMode',
        'notes',
        'bloodPressure',
        'weight',
        'height',
        'relationship',
        'familyMemberName',
        'visitDates',
        'assignedDoctors',
        'gender',
        'bloodGroup',
      ])

      // Extract update data using forEach
      const userUpdateData: any = {}
      const clinicPatientUpdateData: any = {}

      Object.keys(updateData).forEach((key) => {
        const typedKey = key as keyof PatientData
        if (updateData[typedKey] !== undefined) {
          if (userFields.has(key)) {
            userUpdateData[key] = updateData[typedKey]
          } else if (clinicPatientFields.has(key)) {
            clinicPatientUpdateData[key] = updateData[typedKey]
          }
        }
      })

      // If profileImageUrl is provided, update it on the user
      if (updateData.profileImageUrl) {
        userUpdateData.profileImageUrl = updateData.profileImageUrl
      }

      // Update user if there's data to update
      let updatedUser = null
      if (Object.keys(userUpdateData).length > 0) {
        updatedUser = await User.findOneAndUpdate(
          { _id: clinicPatient.userId, deletedAt: null },
          { ...userUpdateData, updatedAt: new Date() },
          { new: true, runValidators: true, session },
        )
      }

      // Update clinic patient record
      const updatedClinicPatient = await ClinicPatient.findOneAndUpdate(
        { _id: clinicPatientId, clinicId: clinicId, deletedAt: null },
        { ...clinicPatientUpdateData, updatedAt: new Date() },
        { new: true, runValidators: true, session },
      ).populate('userId')

      if (!updatedClinicPatient) {
        throw new Error('Failed to update clinic patient record')
      }

      await session.commitTransaction()

      // Get user data for response
      const userData =
        updatedUser?.toObject() ||
        (updatedClinicPatient.userId &&
        typeof updatedClinicPatient.userId === 'object' &&
        'toObject' in updatedClinicPatient.userId
          ? (updatedClinicPatient.userId as any).toObject()
          : {})

      return {
        ...userData,
        clinicPatientData: updatedClinicPatient.toObject(),
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  }

  async deletePatient(clinicPatientId: string, clinicId: mongoose.Types.ObjectId): Promise<IClinicPatient | null> {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      if (!mongoose.Types.ObjectId.isValid(clinicPatientId) || !mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid ID format')
      }

      const deletedClinicPatient = await ClinicPatient.findOneAndUpdate(
        {
          _id: clinicPatientId,
          clinicId: clinicId,
          deletedAt: null,
        },
        {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          new: true,
          session,
        },
      ).populate('userId')

      if (!deletedClinicPatient) {
        throw new Error('Patient not found in this clinic')
      }

      await session.commitTransaction()
      return deletedClinicPatient
    } catch (error) {
      await session.abortTransaction()
      console.error('Error in deletePatient service:', error)
      throw error
    } finally {
      session.endSession()
    }
  }
}
