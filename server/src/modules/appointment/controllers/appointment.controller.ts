import { Request, Response } from 'express'
import { AppointmentService } from '../services'
import { AuthenticatedRequest } from '../../../types'
import { PatientVisitDoctors } from '../../patient/models/patientVisitDoctor'
import { User } from '../../user/models'
import { DoctorMeta } from '../../doctor/models'
import { ClinicPatient } from '../../patient/models'

export class AppointmentController {
  private appointmentService: AppointmentService

  constructor() {
    this.appointmentService = new AppointmentService()
  }

  createAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const appointmentData = req.body
      // If doctorAssignments is present and is an array, create multiple appointments
      if (Array.isArray(appointmentData.doctorAssignments) && appointmentData.doctorAssignments.length > 0) {
        const createdAppointments = [];
        for (const assignment of appointmentData.doctorAssignments) {
          const newAppointment = await this.appointmentService.createAppointment({
            clinicPatientId: appointmentData.clinicPatientId,
            doctorId: assignment.doctorId,
            appointmentTime: assignment.appointmentTime,
            consultationMode: assignment.consultationMode,
            status: assignment.status,
            diagnosis: assignment.diagnosis,
          });
          createdAppointments.push(newAppointment);
        }
        res.status(201).json({
          success: true,
          message: 'Appointments created successfully',
          data: createdAppointments,
        });
      } else {
        // Fallback to single appointment creation
        const newAppointment = await this.appointmentService.createAppointment(appointmentData)
        res.status(201).json({
          success: true,
          message: 'Appointment created successfully',
          data: newAppointment,
        })
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      })
    }
  }

  getAppointmentsByDoctorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params

      const appointments = await this.appointmentService.getAppointmentsByDoctorId(userId)

      res.json({
        success: true,
        message: 'Appointments retrieved successfully',
        data: appointments,
      })
    } catch (error: any) {
      console.error('Error fetching appointments:', error)

      switch (error.message) {
        case 'Invalid doctor ID format':
          res.status(400).json({
            success: false,
            message: error.message,
          })
          break

        case 'No appointments found for this doctor':
          res.status(404).json({
            success: false,
            message: error.message,
          })
          break

        default:
          res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
          })
      }
      return
    }
  }

  getAppointmentsByClinicId = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          message: 'Clinic ID is missing from user context',
        })
        return
      }

      const appointments = await this.appointmentService.getAppointmentsByClinicId(clinicId)

      res.json({
        success: true,
        message: 'Appointments retrieved successfully',
        data: appointments,
      })
    } catch (error: any) {
      console.error('Error fetching clinic appointments:', error)

      switch (error.message) {
        case 'Invalid clinic ID format':
          res.status(400).json({
            success: false,
            message: error.message,
          })
          break

        case 'No appointments found for this clinic':
          res.status(404).json({
            success: false,
            message: error.message,
          })
          break

        default:
          res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
          })
      }
      return
    }
  }

  getAppointmentsCancelled = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params

      const updatedAppointment = await this.appointmentService.cancelAppointment(appointmentId)

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: updatedAppointment,
      })
    } catch (error: any) {
      console.error('Error cancelling appointment:', error)

      switch (error.message) {
        case 'Invalid appointment ID':
          res.status(400).json({
            success: false,
            message: error.message,
          })
          break

        case 'Appointment not found':
          res.status(404).json({
            success: false,
            message: error.message,
          })
          break

        default:
          res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
          })
      }
      return
    }
  }

  updateAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params
      const updateData = req.body

      const updatedAppointment = await this.appointmentService.updateAppointment(appointmentId, updateData)

      res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        data: updatedAppointment,
      })
    } catch (error: any) {
      console.error('Error updating appointment:', error)

      switch (error.message) {
        case 'Invalid appointment ID':
          res.status(400).json({
            success: false,
            message: error.message,
          })
          break

        case 'Appointment not found':
          res.status(404).json({
            success: false,
            message: error.message,
          })
          break

        default:
          res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
          })
      }
      return
    }
  }

  /**
   * Get all visits for a given ClinicPatient ID
   */
  getVisitsByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clinicPatientId } = req.params
      const visits = await this.appointmentService.getVisitsByUserId(clinicPatientId)
      res.status(200).json({
        success: true,
        message: 'Visits retrieved successfully',
        data: visits,
      })
    } catch (error: any) {
      console.error('Error fetching visits by ClinicPatient ID:', error)
      let status = 500
      let message = 'Internal server error'
      if (error.message === 'ClinicPatient ID is required') {
        status = 400
        message = error.message
      } else if (error.message === 'No visits found for this ClinicPatient') {
        status = 404
        message = error.message
      }
      res.status(status).json({
        success: false,
        message,
        error: error.message,
      })
    }
  }

  /**
   * Send appointment reminder via WhatsApp
   */
  sendAppointmentReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params

      const appointment = await this.appointmentService.sendAppointmentReminder(appointmentId)

      res.status(200).json({
        success: true,
        message: 'Appointment reminder sent successfully',
        data: appointment,
      })
    } catch (error: any) {
      console.error('Error sending appointment reminder:', error)

      switch (error.message) {
        case 'Invalid appointment ID':
          res.status(400).json({
            success: false,
            message: error.message,
          })
          break

        case 'Appointment not found':
          res.status(404).json({
            success: false,
            message: error.message,
          })
          break

        default:
          res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
          })
      }
      return
    }
  }

  createAppointmentUsingGoogleForm = async(req:Request, res:Response): Promise<void> =>{
    try {
      const formData = req.body;
      console.log(formData);

      // Extract data from Google Form response
      const {
        "Clinic": clinicId,
        "Full Name": fullName,
        "specialization": specialization,
        "Phone Number": phoneNumber,
        "Email Address": emailAddress,
        "Date of Birth": dateOfBirth,
        "Consultation Mode": consultationMode,
        "Triage Level": triageLevel,
        "Gender": gender,
        "Blood Group": bloodGroup
      } = formData;

      console.log("data1")

      // Validate required fields
      if (!fullName || !emailAddress || !phoneNumber || !specialization || !clinicId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: Clinic, Full Name, Email Address, Phone Number, and specialization are required'
        });
        return;
      }
      console.log("data2")
      // Check if user exists by email
      const existingUser = await User.findOne({ email: emailAddress, clinic: clinicId, deletedAt: null });
      console.log("data3")
      let userId;

      if (!existingUser) {
        // Create new user as patient
        const { randomPassword, hashPassword } = require('../../../utils/password');
        const tempPassword = randomPassword();
        const hashedPassword = await hashPassword(tempPassword);

        const newUser = new User({
          name: fullName,
          email: emailAddress,
          phone: phoneNumber,
          password: hashedPassword,
          roles: ['patient'],
          clinic: clinicId,
          gender: gender || undefined,
          bloodGroup: bloodGroup || undefined,
        });

        const savedUser = await newUser.save();
        userId = savedUser._id;

        // Send welcome email with credentials
        const subject = 'Welcome to PrevaCare - Your Patient Account';
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Patient Registration Success</title></head>
        <body>
          <p>Welcome to PrevaCare!</p>
          <p>Your patient account has been created successfully.</p>
          <p>Login credentials:</p>
          <p>Email: ${emailAddress}</p>
          <p>Temporary password: ${tempPassword}</p>
          <p>Please change your password after first login.</p>
        </body>
        </html>`;

        const { sendEmail } = require('../../../utils/emailClient');
        await sendEmail(
          process.env.ADMIN_EMAIL!,
          emailAddress,
          subject,
          html
        );
      } else {
        userId = existingUser._id;
      }
      console.log("data3")
      // Find doctor by specialization within the specified clinic
      const doctorMeta = await DoctorMeta.findOne({
        'specializations': { $regex: specialization, $options: 'i' }
      }).populate({
        path: 'user_id',
        model: 'User',
        match: { clinic: clinicId }
      });
      console.log("data4")
      if (!doctorMeta || !doctorMeta.user_id) {
        console.log("doctor not found")
        res.status(404).json({
          success: false,
          message: `No doctor found with specialization: ${specialization} in the specified clinic`
        });
        return;
      }
      console.log("data6")
      // Check if clinic patient exists, if not create one
      let clinicPatient = await ClinicPatient.findOne({
        userId: userId,
        clinicId: clinicId,
        deletedAt: null
      });
      console.log("data7")
      if (!clinicPatient) {
        clinicPatient = new ClinicPatient({
          clinicId: clinicId,
          userId: userId,
          DOB: dateOfBirth ? new Date(dateOfBirth) : undefined,
          triage: triageLevel || 'Normal',
          visitDates: [new Date()],
          relationship: 'self',
          assignedDoctors: [doctorMeta.user_id._id.toString()]
        });
        await clinicPatient.save();
      }

      // Calculate appointment time based on doctor's availability
      const appointmentTime = await this.calculateAppointmentTime(doctorMeta, consultationMode);

      // Create appointment data
      const appointmentData = {
        clinicPatientId: clinicPatient._id,
        doctorId: (doctorMeta.user_id as any)._id,
        appointmentTime: appointmentTime,
        consultationMode: consultationMode === 'Tele-Consultation' ? 'tele-consultation' : 'onsite',
        status: 'Pending',
        diagnosis: ''
      };

      // Create appointment
      const newAppointment = await this.appointmentService.createAppointment(appointmentData);

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully from Google Form',
        data: {
          appointment: newAppointment,
          user: existingUser ? 'existing' : 'created',
          doctor: {
            name: (doctorMeta.user_id as any).name,
            specialization: specialization
          },
          appointmentTime: appointmentTime
        }
      });

    } catch (error: any) {
      console.error('Error creating appointment from Google Form:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Helper method to calculate appointment time based on doctor's availability
  private async calculateAppointmentTime(doctorMeta: any, consultationMode: string): Promise<Date> {
    const today = new Date();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    // Get day name
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[today.getDay()];

    // Find today's availability
    const todayAvailability = doctorMeta.availability?.find((avail: any) => avail.day === currentDay);

    if (!todayAvailability || !todayAvailability.slots || todayAvailability.slots.length === 0) {
      // If no availability today, schedule for next available day
      return this.findNextAvailableSlot(doctorMeta, today);
    }

    // Find next available slot today
    for (const slot of todayAvailability.slots) {
      const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
      const slotTime = new Date(today);
      slotTime.setHours(slotHour, slotMinute, 0, 0);

      // If slot is in the future, use it
      if (slotTime > today) {
        return slotTime;
      }
    }

    // If no slots available today, find next available day
    return this.findNextAvailableSlot(doctorMeta, today);
  }

  // Helper method to find next available slot
  private async findNextAvailableSlot(doctorMeta: any, startDate: Date): Promise<Date> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);

      const dayName = days[checkDate.getDay()];
      const dayAvailability = doctorMeta.availability?.find((avail: any) => avail.day === dayName);

      if (dayAvailability && dayAvailability.slots && dayAvailability.slots.length > 0) {
        // Use the first slot of the day
        const [slotHour, slotMinute] = dayAvailability.slots[0].startTime.split(':').map(Number);
        const appointmentTime = new Date(checkDate);
        appointmentTime.setHours(slotHour, slotMinute, 0, 0);
        return appointmentTime;
      }
    }

    // If no availability found in next 7 days, schedule for tomorrow at 9 AM
    const tomorrow = new Date(startDate);
    tomorrow.setDate(startDate.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  getCompletedAppointmentsByClinicId = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          message: 'Clinic ID is missing from user context',
        })
        return
      }

      const appointments = await this.appointmentService.getCompletedAppointmentsByClinicId(clinicId)

      res.json({
        success: true,
        message: 'Completed appointments retrieved successfully',
        data: appointments,
      })
    } catch (error: any) {
      console.error('Error fetching completed appointments:', error)

      switch (error.message) {
        case 'Invalid clinic ID format':
          res.status(400).json({
            success: false,
            message: error.message,
          })
          break

        case 'No completed appointments found for this clinic':
          res.status(404).json({
            success: false,
            message: error.message,
          })
          break

        default:
          res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
          })
      }
      return
    }
  }

}
