import mongoose, { Types } from 'mongoose'
import { PatientVisitDoctors, Status, ConsultationMode } from '../../patient/models'
import { ClinicPatient } from '../../patient/models'
import { NotificationService } from '../../notification/services/notification.service'
import { User } from '../../user/models'
import { DoctorMeta } from '../../doctor/models'
import { Clinic } from '../../clinic/models'
import WhatsAppService from '../../../utils/whatsappService'

type UpdateAppointmentData = {
  prescriptionId?: string
  consultationMode?: string
  status?: string
  appointmentTime?: Date | string
}

// Utility functions for generating teleconsultation session data
const generateRandomChannelName = (appointmentId: string): string => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `appointment_${appointmentId}_${timestamp}_${randomSuffix}`
}

const generateRandomUid = (): number => {
  return Math.floor(Math.random() * 1000000) + 1000000 // 7-digit UID
}

export class AppointmentService {
  private notificationService: NotificationService
  private whatsAppService: WhatsAppService

  constructor() {
    this.notificationService = new NotificationService()
    this.whatsAppService = new WhatsAppService()
  }

  // Helper method to send notifications to clinic users
  private async sendClinicNotifications(
    clinicId: mongoose.Types.ObjectId,
    notificationData: {
      title: string
      message: string
      type: string
      metadata: Record<string, any>
    }
  ) {
    try {
      console.log('🔍 sendClinicNotifications - Starting with clinicId:', clinicId)
      console.log('🔍 sendClinicNotifications - clinicId type:', typeof clinicId)
      console.log('🔍 sendClinicNotifications - clinicId instanceof ObjectId:', clinicId instanceof mongoose.Types.ObjectId)

      // Find all admin, clinic-head, and clinic-admin users for this clinic
      const clinicUsers = await User.find({
        clinic: clinicId,
        roles: { $in: ['admin', 'clinic-admin', 'clinic-head'] },
        deletedAt: null
      })

      console.log('🔍 sendClinicNotifications - Found clinic users:', clinicUsers.length)
      clinicUsers.forEach(user => {
        console.log(`  - User: ${user.name} (${user.roles.join(', ')}) - ID: ${user._id}`)
      })

      if (clinicUsers.length > 0) {
        const notifications = clinicUsers.map(user => ({
          userId: user._id.toString(),
          clinicId: clinicId.toString(),
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          metadata: notificationData.metadata
        }))

        console.log('🔍 sendClinicNotifications - Creating bulk notifications:', notifications.length)
        console.log('🔍 sendClinicNotifications - First notification sample:', notifications[0])

        const result = await this.notificationService.createBulkNotifications(notifications)
        console.log(`✅ Sent notifications to ${clinicUsers.length} clinic users. Result:`, result.length)
      } else {
        console.log('⚠️ sendClinicNotifications - No clinic users found for clinicId:', clinicId)

        // Let's also check what users exist in the database
        const allUsers = await User.find({}).limit(5)
        console.log('🔍 sendClinicNotifications - Sample of all users in database:')
        allUsers.forEach(user => {
          console.log(`  - User: ${user.name} (${user.roles.join(', ')}) - Clinic: ${user.clinic}`)
        })
      }
    } catch (error: any) {
      console.error('❌ Error sending clinic notifications:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        clinicId: clinicId,
        notificationData: notificationData
      })
      // Don't throw error, continue with other operations
    }
  }

  // Helper method to send doctor notification
  private async sendDoctorNotification(
    doctorId: string,
    clinicId: string,
    notificationData: {
      title: string
      message: string
      type: string
      metadata: Record<string, any>
    }
  ) {
    try {
      console.log('🔍 sendDoctorNotification - Starting with doctorId:', doctorId)
      console.log('🔍 sendDoctorNotification - clinicId:', clinicId)
      console.log('🔍 sendDoctorNotification - Notification data:', notificationData)

      const result = await this.notificationService.createNotification({
        userId: doctorId,
        clinicId: clinicId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        metadata: notificationData.metadata
      })

      console.log(`✅ Sent notification to doctor: ${doctorId}. Result:`, result._id)
    } catch (error: any) {
      console.error('❌ Error sending doctor notification:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        doctorId: doctorId,
        clinicId: clinicId,
        notificationData: notificationData
      })
      // Don't throw error, continue with other operations
    }
  }

  async getAppointmentsByDoctorId(doctorId: string) {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid doctor ID format')
    }

    const appointments = await PatientVisitDoctors.find({
      doctorId: new mongoose.Types.ObjectId(doctorId),
    })
      .populate({
        path: 'clinicPatientId',
        model: ClinicPatient,
        populate: {
          path: 'userId',
          model: 'User',
        },
      })
      .populate({
        path: 'doctorId',
        model: 'DoctorMeta',
        populate: {
          path: 'userId',
          model: 'User',
        },
      })
      .sort({ appointmentTime: -1 }) // Sort by most recent first (descending order)

    return appointments
  }

  async getAppointmentsByClinicId(clinicId: Types.ObjectId) {
    // Validate the clinicId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      throw new Error('Invalid clinic ID format')
    }

    try {
      // Use aggregation pipeline for better performance
      const appointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient',
          },
        },
        {
          $unwind: '$clinicPatient',
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            status: { $ne: Status.COMPLETED }, // Exclude completed appointments
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'clinicPatient.userId',
            foreignField: '_id',
            as: 'clinicPatient.user',
          },
        },
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'doctor.userId',
            foreignField: '_id',
            as: 'doctor.user',
          },
        },
        {
          $addFields: {
            'clinicPatient.user': { $arrayElemAt: ['$clinicPatient.user', 0] },
            'doctor.user': { $arrayElemAt: ['$doctor.user', 0] },
          },
        },
        {
          $sort: { appointmentTime: -1 }, // Sort by most recent first (descending order)
        },
      ])

      return appointments
    } catch (error) {
      console.error('Error in aggregation pipeline:', error)
      throw error
    }
  }

  async getCompletedAppointmentsByClinicId(clinicId: Types.ObjectId) {
    // Validate the clinicId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      throw new Error('Invalid clinic ID format')
    }

    try {
      // Use aggregation pipeline for better performance
      const appointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient',
          },
        },
        {
          $unwind: '$clinicPatient',
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            status: Status.COMPLETED, // Show all completed appointments regardless of mode
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'clinicPatient.userId',
            foreignField: '_id',
            as: 'clinicPatient.user',
          },
        },
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'doctor.userId',
            foreignField: '_id',
            as: 'doctor.user',
          },
        },
        {
          $addFields: {
            'clinicPatient.user': { $arrayElemAt: ['$clinicPatient.user', 0] },
            'doctor.user': { $arrayElemAt: ['$doctor.user', 0] },
          },
        },
        {
          $sort: { appointmentTime: -1 }, // Sort by most recent first
        },
      ])

      if (!appointments || appointments.length === 0) {
        throw new Error('No completed appointments found for this clinic')
      }

      return appointments
    } catch (error) {
      console.error('Error in aggregation pipeline:', error)
      throw error
    }
  }

  async cancelAppointment(appointmentId: string) {
    // Validate the appointmentId
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error('Invalid appointment ID')
    }

    // Find and update the appointment
    const updatedAppointment = await PatientVisitDoctors.findByIdAndUpdate(
      appointmentId,
      { status: Status.CANCELLED },
      { new: true },
    ).populate({
      path: 'clinicPatientId',
      model: ClinicPatient,
      populate: {
        path: 'userId',
        model: 'User',
      },
    }).populate({
      path: 'doctorId',
      model: 'DoctorMeta',
      populate: {
        path: 'userId',
        model: 'User',
      },
    })

    if (!updatedAppointment) {
      throw new Error('Appointment not found')
    }

    // Send WhatsApp cancellation notification to patient
    try {
      const patient = (updatedAppointment.clinicPatientId as any)?.userId
      const doctor = (updatedAppointment.doctorId as any)?.userId

      if (patient && doctor) {
        await this.whatsAppService.sendAppointmentCancellation(
          patient.name,
          doctor.name,
          updatedAppointment.appointmentTime,
          patient.phone
        )
      }
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp cancellation notification:', whatsappError)
      // Don't throw error, continue with other notifications
    }

    // Send notification to the doctor
    if (updatedAppointment.doctorId) {
      const clinicPatient = await ClinicPatient.findById(updatedAppointment.clinicPatientId)
      if (clinicPatient) {
        await this.sendDoctorNotification(
          updatedAppointment.doctorId.toString(),
          clinicPatient.clinicId.toString(),
          {
            title: 'Appointment Cancelled',
            message: `Your appointment scheduled for ${updatedAppointment.appointmentTime} has been cancelled.`,
            type: 'appointment',
            metadata: {
              appointmentId: appointmentId,
              appointmentTime: updatedAppointment.appointmentTime,
              consultationMode: updatedAppointment.consultationMode,
              status: 'cancelled'
            }
          }
        )
      }
    }

    // Send notification to clinic users
    const clinicPatient = await ClinicPatient.findById(updatedAppointment.clinicPatientId)
    if (clinicPatient) {
      await this.sendClinicNotifications(
        clinicPatient.clinicId,
        {
          title: 'Appointment Cancelled',
          message: `An appointment has been cancelled in your clinic.`,
          type: 'appointment',
          metadata: {
            appointmentId: appointmentId,
            doctorId: updatedAppointment.doctorId ? updatedAppointment.doctorId.toString() : '',
            appointmentTime: updatedAppointment.appointmentTime,
            consultationMode: updatedAppointment.consultationMode,
            status: 'cancelled'
          }
        }
      )
    }

    return updatedAppointment
  }

  async updateAppointment(appointmentId: string, updateData: UpdateAppointmentData) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error('Invalid appointment ID')
    }

    // Find the existing appointment first
    const existingAppointment = await PatientVisitDoctors.findById(appointmentId)
    if (!existingAppointment) {
      throw new Error('Appointment not found')
    }

    // Update the appointment
    const updatedAppointment = await PatientVisitDoctors.findByIdAndUpdate(appointmentId, updateData, {
      new: true,
      runValidators: true,
    }).populate({
      path: 'clinicPatientId',
      model: ClinicPatient,
      populate: {
        path: 'userId',
        model: 'User',
      },
    })

    if (!updatedAppointment) {
      throw new Error('Appointment not found')
    }

    // Determine what changed for notification purposes
    const changes = []
    if (updateData.appointmentTime && updateData.appointmentTime !== existingAppointment.appointmentTime) {
      changes.push('appointment time')
    }
    if (updateData.consultationMode && updateData.consultationMode !== existingAppointment.consultationMode) {
      changes.push('consultation mode')
    }
    if (updateData.status && updateData.status !== existingAppointment.status) {
      changes.push('status')
    }

    // Create notifications if any changes were made
    if (changes.length > 0) {
      const changeText = changes.join(', ')

      // Send notification to the doctor
      if (updatedAppointment.doctorId) {
        const clinicPatient = await ClinicPatient.findById(updatedAppointment.clinicPatientId)
        if (clinicPatient) {
          await this.sendDoctorNotification(
            updatedAppointment.doctorId.toString(),
            clinicPatient.clinicId.toString(),
            {
              title: 'Appointment Updated',
              message: `Your appointment has been updated. Changes: ${changeText}`,
              type: 'appointment',
              metadata: {
                appointmentId: appointmentId,
                appointmentTime: updatedAppointment.appointmentTime,
                consultationMode: updatedAppointment.consultationMode,
                status: updatedAppointment.status,
                changes: changes
              }
            }
          )
        }
      }

      // Send notification to clinic users
      const clinicPatient = await ClinicPatient.findById(updatedAppointment.clinicPatientId)
      if (clinicPatient) {
        await this.sendClinicNotifications(
          clinicPatient.clinicId,
          {
            title: 'Appointment Updated',
            message: `An appointment has been updated in your clinic. Changes: ${changeText}`,
            type: 'appointment',
            metadata: {
              appointmentId: appointmentId,
              doctorId: updatedAppointment.doctorId ? updatedAppointment.doctorId.toString() : '',
              appointmentTime: updatedAppointment.appointmentTime,
              consultationMode: updatedAppointment.consultationMode,
              status: updatedAppointment.status,
              changes: changes
            }
          }
        )
      }
    }

    return updatedAppointment
  }

  async createAppointment(appointmentData: any) {
    // Generate teleconsultation session data if consultation mode is tele-consultation
    if (appointmentData.consultationMode === ConsultationMode.TELE_CONSULTATION) {
      // Create appointment first to get the ID
      const newAppointment = await PatientVisitDoctors.create(appointmentData)

      // Generate teleconsultation session data
      const teleconsultationSession = {
        channelName: generateRandomChannelName((newAppointment._id as any).toString()),
        doctorUid: generateRandomUid(),
        patientUid: generateRandomUid(),
        status: 'pending' as const,
        startTime: null,
        endTime: null,
      }

      // Update the appointment with teleconsultation session data
      const updatedAppointment = await PatientVisitDoctors.findByIdAndUpdate(
        newAppointment._id,
        { teleconsultationSession },
        { new: true }
      ).populate({
        path: 'clinicPatientId',
        model: ClinicPatient,
        populate: {
          path: 'userId',
          model: 'User',
        },
      }).populate({
        path: 'doctorId',
        model: 'DoctorMeta',
        populate: {
          path: 'userId',
          model: 'User',
        },
      })

      if (!updatedAppointment) {
        throw new Error('Failed to update appointment with teleconsultation session')
      }

      // Send WhatsApp notification to patient
      try {
        const patient = (updatedAppointment.clinicPatientId as any)?.userId
        const doctor = (updatedAppointment.doctorId as any)?.userId || (updatedAppointment.doctorId as any)

        console.log('WhatsApp Debug - Patient:', patient)
        console.log('WhatsApp Debug - Doctor:', doctor)
        console.log('WhatsApp Debug - Updated Appointment:', updatedAppointment)
        console.log('WhatsApp Debug - Doctor ID raw:', updatedAppointment.doctorId)

        if (patient) {
          console.log('WhatsApp Debug - Sending teleconsultation link')
          await this.whatsAppService.sendTeleconsultationLink(
            patient.name,
            doctor?.name || 'Dr. Unknown',
            updatedAppointment.appointmentTime,
            (updatedAppointment._id as any).toString(),
            patient.phone
          )
          console.log('WhatsApp Debug - Teleconsultation link sent successfully')
        } else {
          console.log('WhatsApp Debug - Patient or doctor data missing')
          console.log('WhatsApp Debug - Patient exists:', !!patient)

        }
      } catch (whatsappError) {
        console.error('Failed to send WhatsApp notification:', whatsappError)
        console.error('WhatsApp Error Details:', {
          error: whatsappError,
        })
        // Don't throw error, continue with other notifications
      }

      // Send notification to the doctor
      if (updatedAppointment.doctorId) {
        const clinicPatient = await ClinicPatient.findById(updatedAppointment.clinicPatientId)
        if (clinicPatient) {
          await this.sendDoctorNotification(
            updatedAppointment.doctorId.toString(),
            clinicPatient.clinicId.toString(),
            {
              title: 'New Teleconsultation Appointment Assigned',
              message: `You have been assigned a new teleconsultation appointment scheduled for ${updatedAppointment.appointmentTime}`,
              type: 'appointment',
              metadata: {
                appointmentId: updatedAppointment._id ? (updatedAppointment._id as any).toString() : '',
                appointmentTime: updatedAppointment.appointmentTime,
                consultationMode: updatedAppointment.consultationMode,
                status: 'assigned',
                teleconsultationSession: teleconsultationSession
              }
            }
          )
        }
      }

      // Send notification to clinic users
      const clinicPatient = await ClinicPatient.findById(updatedAppointment.clinicPatientId)
      if (clinicPatient) {
        console.log('🔍 Teleconsultation - Found clinicPatient:', clinicPatient._id)
        console.log('🔍 Teleconsultation - clinicPatient.clinicId:', clinicPatient.clinicId)
        console.log('🔍 Teleconsultation - clinicPatient.clinicId type:', typeof clinicPatient.clinicId)

        await this.sendClinicNotifications(
          clinicPatient.clinicId,
          {
            title: 'New Teleconsultation Appointment Created',
            message: `A new teleconsultation appointment has been created in your clinic`,
            type: 'appointment',
            metadata: {
              appointmentId: updatedAppointment._id ? (updatedAppointment._id as any).toString() : '',
              doctorId: updatedAppointment.doctorId ? updatedAppointment.doctorId.toString() : '',
              appointmentTime: updatedAppointment.appointmentTime,
              consultationMode: updatedAppointment.consultationMode,
              status: 'created',
              teleconsultationSession: teleconsultationSession
            }
          }
        )
      } else {
        console.log('⚠️ Teleconsultation - No clinicPatient found for appointment:', updatedAppointment.clinicPatientId)
      }

      return updatedAppointment
    } else {
      // Regular appointment creation for non-teleconsultation modes
      const newAppointment = await PatientVisitDoctors.create(appointmentData)

      // Populate appointment with patient and doctor details for WhatsApp notification
      const populatedAppointment = await PatientVisitDoctors.findById(newAppointment._id)
        .populate({
          path: 'clinicPatientId',
          model: ClinicPatient,
          populate: {
            path: 'userId',
            model: 'User',
          },
        })
        .populate({
          path: 'doctorId',
          model: 'DoctorMeta',
          populate: {
            path: 'userId',
            model: 'User',
          },
        })

      // Send WhatsApp notification to patient
      try {
        const patient = (populatedAppointment?.clinicPatientId as any)?.userId
        const clinicPatient = populatedAppointment?.clinicPatientId as any

        // Fetch doctor information from assigned doctors array
        let doctor = null
        console.log('WhatsApp Debug - Assigned Doctors:', clinicPatient?.assignedDoctors)

        if (clinicPatient?.assignedDoctors && clinicPatient.assignedDoctors.length > 0) {
          const doctorId = clinicPatient.assignedDoctors[0] // Get first assigned doctor
          console.log('WhatsApp Debug - Fetching doctor with ID:', doctorId)
          doctor = await DoctorMeta.findById(doctorId).populate('userId')
          console.log('WhatsApp Debug - Fetched doctor:', doctor)
        } else {
          // If no assigned doctors, use a generic doctor name
          doctor = { userId: { name: 'Dr. Clinic' } }
          console.log('WhatsApp Debug - No assigned doctors, using generic doctor')
        }

        console.log('WhatsApp Debug - Regular Appointment - Patient:', patient)
        console.log('WhatsApp Debug - Regular Appointment - Doctor:', doctor)
        console.log('WhatsApp Debug - Regular Appointment - Populated Appointment:', populatedAppointment)
        console.log('WhatsApp Debug - Regular Appointment - Doctor ID raw:', populatedAppointment?.doctorId)

        if (patient) {
          console.log('WhatsApp Debug - Sending regular appointment confirmation')
          await this.whatsAppService.sendAppointmentConfirmation(
            patient.name,
            (doctor as any)?.userId?.name || 'Dr. Unknown',
            populatedAppointment!.appointmentTime,
            populatedAppointment!.consultationMode,
            patient.phone
          )
          console.log('WhatsApp Debug - Regular appointment confirmation sent successfully')
        } else {
          console.log('WhatsApp Debug - Regular Appointment - Patient data missing')
          console.log('WhatsApp Debug - Regular Appointment - Patient exists:', !!patient)
        }
      } catch (whatsappError) {
        console.error('Failed to send WhatsApp notification for regular appointment:', whatsappError)
        console.error('WhatsApp Error Details - Regular Appointment:', {
          error: whatsappError,
        })
        // Don't throw error, continue with other notifications
      }

      // Send notification to the doctor
      if (newAppointment.doctorId) {
        const clinicPatient = await ClinicPatient.findById(newAppointment.clinicPatientId)
        if (clinicPatient) {
          await this.sendDoctorNotification(
            newAppointment.doctorId.toString(),
            clinicPatient.clinicId.toString(),
            {
              title: 'New Appointment Assigned',
              message: `You have been assigned a new appointment scheduled for ${newAppointment.appointmentTime}`,
              type: 'appointment',
              metadata: {
                appointmentId: newAppointment._id ? (newAppointment as any)._id.toString() : '',
                appointmentTime: newAppointment.appointmentTime,
                consultationMode: newAppointment.consultationMode,
                status: 'assigned'
              }
            }
          )
        }
      }

      // Send notification to clinic users
      const clinicPatient = await ClinicPatient.findById(newAppointment.clinicPatientId)
      if (clinicPatient) {
        console.log('🔍 Regular Appointment - Found clinicPatient:', clinicPatient._id)
        console.log('🔍 Regular Appointment - clinicPatient.clinicId:', clinicPatient.clinicId)
        console.log('🔍 Regular Appointment - clinicPatient.clinicId type:', typeof clinicPatient.clinicId)

        await this.sendClinicNotifications(
          clinicPatient.clinicId,
          {
            title: 'New Appointment Created',
            message: `A new appointment has been created in your clinic`,
            type: 'appointment',
            metadata: {
              appointmentId: newAppointment._id ? (newAppointment as any)._id.toString() : '',
              doctorId: newAppointment.doctorId ? newAppointment.doctorId.toString() : '',
              appointmentTime: newAppointment.appointmentTime,
              consultationMode: newAppointment.consultationMode,
              status: 'created'
            }
          }
        )
      } else {
        console.log('⚠️ Regular Appointment - No clinicPatient found for appointment:', newAppointment.clinicPatientId)
      }

      return populatedAppointment || newAppointment
    }
  }

  async getVisitsByUserId(userId: string) {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const clinicPatients = await ClinicPatient.find({ userId })
    if (!clinicPatients || clinicPatients.length === 0) {
      return []
    }
    const clinicPatientIds = clinicPatients.map((cp) => cp._id)
    // Find all visits for these clinicPatientIds (excluding completed ones)
    const visits = await PatientVisitDoctors.find({
      clinicPatientId: { $in: clinicPatientIds },
      status: { $ne: Status.COMPLETED } // Exclude completed appointments
    })
      .populate({
        path: 'doctorId',
        model: 'DoctorMeta',
        populate: {
          path: 'userId',
          model: 'User',
        },
      })
      .populate({
        path: 'clinicPatientId',
        model: ClinicPatient,
        populate: {
          path: 'clinicId',
          model: 'Clinic',
        },
      })
      .sort({ appointmentTime: -1 })
    return visits
  }

  async sendAppointmentReminder(appointmentId: string) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error('Invalid appointment ID')
    }

    const appointment = await PatientVisitDoctors.findById(appointmentId)
      .populate({
        path: 'clinicPatientId',
        model: ClinicPatient,
        populate: {
          path: 'userId',
          model: 'User',
        },
      })
      .populate({
        path: 'doctorId',
        model: 'DoctorMeta',
        populate: {
          path: 'userId',
          model: 'User',
        },
      })

    if (!appointment) {
      throw new Error('Appointment not found')
    }

    // Only send reminders for non-teleconsultation appointments
    if (appointment.consultationMode !== ConsultationMode.TELE_CONSULTATION) {
      try {
        const patient = (appointment.clinicPatientId as any)?.userId
        const clinicPatient = appointment.clinicPatientId as any

        // Fetch doctor information from assigned doctors array
        let doctor = null
        console.log('WhatsApp Debug - Reminder - Assigned Doctors:', clinicPatient?.assignedDoctors)

        if (clinicPatient?.assignedDoctors && clinicPatient.assignedDoctors.length > 0) {
          const doctorId = clinicPatient.assignedDoctors[0] // Get first assigned doctor
          console.log('WhatsApp Debug - Reminder - Fetching doctor with ID:', doctorId)
          doctor = await DoctorMeta.findById(doctorId).populate('userId')
          console.log('WhatsApp Debug - Reminder - Fetched doctor:', doctor)
        } else {
          // If no assigned doctors, use a generic doctor name
          doctor = { userId: { name: 'Dr. Clinic' } }
          console.log('WhatsApp Debug - Reminder - No assigned doctors, using generic doctor')
        }

        if (patient) {
          await this.whatsAppService.sendAppointmentReminder(
            patient.name,
            (doctor as any)?.userId?.name || 'Dr. Unknown',
            appointment.appointmentTime,
            appointment.consultationMode,
            patient.phone,
            undefined
          )
        }
      } catch (whatsappError) {
        console.error('Failed to send WhatsApp reminder:', whatsappError)
        // Don't throw error, continue with other notifications
      }
    }

    return appointment
  }
}
