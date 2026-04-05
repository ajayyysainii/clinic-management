import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import generateAgoraToken from './token';
import { PatientVisitDoctors, ClinicPatient } from '../patient/models';
import { User } from '../user/models';
// Ensure models are registered


interface TeleconsultationSession {
  appointmentId: string;
  channelName: string;
  doctorUid: number;
  patientUid: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
}

export class TeleconsultationController {
  // Generate token for doctor
  generateDoctorToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;
      console.log(appointmentId)

      if (!appointmentId) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required',
        });
        return;
      }

      // Verify appointment exists and has teleconsultation session data
      const appointment = await PatientVisitDoctors.findById(appointmentId)
        // .populate('clinicPatientId')
        // .populate('clinicPatientId.userId');

      if (!appointment) {
        res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
        return;
      }

      // Check if appointment is a teleconsultation appointment
      if (appointment.consultationMode !== 'tele-consultation') {
        res.status(400).json({
          success: false,
          message: 'This appointment is not a teleconsultation appointment',
        });
        return;
      }

      // Check if teleconsultation session data exists
      if (!appointment.teleconsultationSession) {
        res.status(400).json({
          success: false,
          message: 'Teleconsultation session data not found. Please create the appointment again.',
        });
        return;
      }

      const { channelName, doctorUid } = appointment.teleconsultationSession;

      // Generate token for doctor using pre-generated session data
      console.log('AGORA_APP_ID:', process.env.AGORA_APP_ID);
      console.log('AGORA_APP_CERTIFICATE:', process.env.AGORA_APP_CERTIFICATE ? 'SET' : 'NOT SET');

      const tokenResponse = generateAgoraToken(doctorUid, channelName, 3600, 3600);
      console.log('DOCTOR Token Response:', tokenResponse);

      // Update appointment with session start time
      await PatientVisitDoctors.findByIdAndUpdate(appointmentId, {
        $set: {
          'teleconsultationSession.startTime': new Date(),
          'teleconsultationSession.status': 'active',
        },
      });

      res.status(200).json({
        success: true,
        message: 'Teleconsultation session started successfully',
        data: {
          appId: process.env.AGORA_APP_ID,
          token: tokenResponse.token,
          channelName: tokenResponse.channelName,
          uid: tokenResponse.uid,
          appointmentId,
          patientInfo: {
            name: (appointment.clinicPatientId as any)?.userId?.name || 'Unknown',
            email: (appointment.clinicPatientId as any)?.userId?.email || 'Unknown',
          },
        },
      });
    } catch (error: any) {
      console.error('Error generating doctor token:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };

  // Generate token for patient
  generatePatientToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required',
        });
        return;
      }

      // Verify appointment exists and has teleconsultation session data
      const appointment = await PatientVisitDoctors.findById(appointmentId)


      if (!appointment) {
        res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
        return;
      }

      // Check if appointment is a teleconsultation appointment
      if (appointment.consultationMode !== 'tele-consultation') {
        res.status(400).json({
          success: false,
          message: 'This appointment is not a teleconsultation appointment',
        });
        return;
      }

      // Check if teleconsultation session data exists
      if (!appointment.teleconsultationSession) {
        res.status(400).json({
          success: false,
          message: 'Teleconsultation session data not found',
        });
        return;
      }

      const { channelName, patientUid } = appointment.teleconsultationSession;

      // Generate token for patient using pre-generated session data
      const tokenResponse = generateAgoraToken(patientUid, channelName, 3600, 3600);
      console.log("Patient token response:", tokenResponse);

      res.status(200).json({
        success: true,
        message: 'Patient token generated successfully',
        data: {
          appId: process.env.AGORA_APP_ID,
          token: tokenResponse.token,
          channelName: tokenResponse.channelName,
          uid: tokenResponse.uid,
          appointmentId,
        },
      });
    } catch (error: any) {
      console.error('Error generating patient token:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };

  // Get teleconsultation session details
  getSessionDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;
      const userId = req.currentUser?.id;

      if (!appointmentId) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required',
        });
        return;
      }

      const appointment = await PatientVisitDoctors.findById(appointmentId)
        .populate('clinicPatientId')
        .populate('clinicPatientId.userId');

      if (!appointment) {
        res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
        return;
      }

      // Check if user has access to this appointment
      const isDoctor = appointment.doctorId.toString() === userId?.toString();
      const isPatient = (appointment.clinicPatientId as any)?.userId?._id.toString() === userId?.toString();

      if (!isDoctor && !isPatient) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Session details retrieved successfully',
        data: {
          appointmentId,
          session: appointment.teleconsultationSession || null,
          patientInfo: {
            name: (appointment.clinicPatientId as any)?.userId?.name || 'Unknown',
            email: (appointment.clinicPatientId as any)?.userId?.email || 'Unknown',
          },
          appointmentTime: appointment.appointmentTime,
          consultationMode: appointment.consultationMode,
        },
      });
    } catch (error: any) {
      console.error('Error getting session details:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };

  // End teleconsultation session
  endSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;
      const userId = req.currentUser?.id;

      if (!appointmentId) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required',
        });
        return;
      }

      const appointment = await PatientVisitDoctors.findById(appointmentId);

      if (!appointment) {
        res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
        return;
      }

      // Only doctor can end the session
      if (appointment.doctorId.toString() !== userId?.toString()) {
        res.status(403).json({
          success: false,
          message: 'Only the doctor can end the teleconsultation session',
        });
        return;
      }

      // Update session status
      await PatientVisitDoctors.findByIdAndUpdate(appointmentId, {
        $set: {
          'teleconsultationSession.status': 'completed',
          'teleconsultationSession.endTime': new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Teleconsultation session ended successfully',
      });
    } catch (error: any) {
      console.error('Error ending session:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };
}
