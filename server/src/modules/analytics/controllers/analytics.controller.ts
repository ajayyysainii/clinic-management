import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../types';
import { AnalyticsService } from '../services/analytics.service';
import mongoose from 'mongoose';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  // Get basic stats (patients, appointments, revenue, staff)
  getBasicStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.currentUser?.id;
      const userRole = req.currentUser?.roles;
      const clinicId = req.currentUser?.clinic;
      const requestedRole = req.query.role as string;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      let stats;

      if (requestedRole === 'doctor' || (!requestedRole && userRole?.includes('doctor'))) {
        stats = await this.analyticsService.getDoctorBasicStats(userId);
      } else {
        if (!clinicId) {
          res.status(400).json({
            success: false,
            message: 'Clinic information is required'
          });
          return;
        }
        stats = await this.analyticsService.getClinicBasicStats(clinicId as any);
      }

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error fetching basic stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };

  // Get recent appointments
  getRecentAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.currentUser?.id;
      const userRole = req.currentUser?.roles;
      const clinicId = req.currentUser?.clinic;
      const requestedRole = req.query.role as string;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      let appointments;

      // Check if user is a doctor or if role=doctor is requested
      const isDoctor = userRole?.includes('doctor') || requestedRole === 'doctor';

      if (isDoctor) {
        appointments = await this.analyticsService.getDoctorRecentAppointments(userId);
      } else {
        // For clinic role or hybrid users, use clinic data
        if (!clinicId) {
          res.status(400).json({
            success: false,
            message: 'Clinic information is required'
          });
          return;
        }
        appointments = await this.analyticsService.getClinicRecentAppointments(clinicId as any);
      }

      // Handle empty appointments array gracefully
      if (!appointments || appointments.length === 0) {
        res.status(200).json({
          success: true,
          data: [],
          message: 'No recent appointments found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error: any) {
      console.error('Error fetching recent appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };

  // Get system alerts
  getSystemAlerts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic;

      if (!clinicId) {
        res.status(400).json({
          success: false,
          message: 'Clinic information is required'
        });
        return;
      }

      const alerts = await this.analyticsService.getSystemAlerts(clinicId as any);

      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error: any) {
      console.error('Error fetching system alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };

  // Legacy dashboard endpoint (keeping for backward compatibility)
  getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.currentUser?.id;
      const userRole = req.currentUser?.roles;
      const clinicId = req.currentUser?.clinic;
      const requestedRole = req.query.role as string;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      let analyticsData;

      if (requestedRole === 'doctor' || (!requestedRole && userRole?.includes('doctor'))) {
        analyticsData = await this.analyticsService.getDoctorAnalytics(userId);
      } else {
        if (!clinicId) {
          res.status(400).json({
            success: false,
            message: 'Clinic information is required'
          });
          return;
        }
        analyticsData = await this.analyticsService.getClinicAnalytics(clinicId as any);
      }

      res.status(200).json({
        success: true,
        data: analyticsData
      });
    } catch (error: any) {
      console.error('Error fetching dashboard analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };

  getRevenueAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic;
      const { period = 'month' } = req.query;

      if (!clinicId) {
        res.status(400).json({
          success: false,
          message: 'Clinic information is required'
        });
        return;
      }

      const revenueData = await this.analyticsService.getRevenueAnalytics(clinicId as any, period as string);

      res.status(200).json({
        success: true,
        data: revenueData
      });
    } catch (error: any) {
      console.error('Error fetching revenue analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };

  getAppointmentAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.currentUser?.id;
      const userRole = req.currentUser?.roles;
      const clinicId = req.currentUser?.clinic;
      const { period = 'month' } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      let appointmentData;

      if (userRole?.includes('doctor')) {
        appointmentData = await this.analyticsService.getDoctorAppointmentAnalytics(userId, period as string);
      } else {
        if (!clinicId) {
          res.status(400).json({
            success: false,
            message: 'Clinic information is required'
          });
          return;
        }
        appointmentData = await this.analyticsService.getClinicAppointmentAnalytics(clinicId as any, period as string);
      }

      res.status(200).json({
        success: true,
        data: appointmentData
      });
    } catch (error: any) {
      console.error('Error fetching appointment analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };

  getPatientAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic;
      const { period = 'month' } = req.query;

      if (!clinicId) {
        res.status(400).json({
          success: false,
          message: 'Clinic information is required'
        });
        return;
      }

      const patientData = await this.analyticsService.getPatientAnalytics(clinicId as any, period as string);

      res.status(200).json({
        success: true,
        data: patientData
      });
    } catch (error: any) {
      console.error('Error fetching patient analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };

  // Debug endpoint to check database data
  debugDatabaseData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic;

      if (!clinicId) {
        res.status(400).json({
          success: false,
          message: 'Clinic information is required'
        });
        return;
      }

      // Import models
      const { ClinicPatient } = await import('../../patient/models');
      const { PatientVisitDoctors } = await import('../../patient/models');
      const { User } = await import('../../user/models');
      const Invoice = await import('../../billing/patient/models/invoice.model').then(m => m.default);

      // Check various data counts
      const totalAppointments = await PatientVisitDoctors.countDocuments();
      const totalClinicPatients = await ClinicPatient.countDocuments();
      const clinicPatients = await ClinicPatient.countDocuments({ clinicId: new mongoose.Types.ObjectId(clinicId) });
      const totalUsers = await User.countDocuments();
      const totalInvoices = await Invoice.countDocuments();
      const clinicInvoices = await Invoice.countDocuments({ clinic_id: new mongoose.Types.ObjectId(clinicId) });

      // Get sample data
      const sampleAppointments = await PatientVisitDoctors.find().limit(3);
      const sampleClinicPatients = await ClinicPatient.find({ clinicId: new mongoose.Types.ObjectId(clinicId) }).limit(3);
      const sampleInvoices = await Invoice.find({ clinic_id: new mongoose.Types.ObjectId(clinicId) }).limit(3);

      res.status(200).json({
        success: true,
        data: {
          counts: {
            totalAppointments,
            totalClinicPatients,
            clinicPatients,
            totalUsers,
            totalInvoices,
            clinicInvoices
          },
          sampleAppointments: sampleAppointments.map(apt => ({
            id: apt._id,
            clinicPatientId: apt.clinicPatientId,
            doctorId: apt.doctorId,
            appointmentTime: apt.appointmentTime,
            status: apt.status
          })),
          sampleClinicPatients: sampleClinicPatients.map(cp => ({
            id: cp._id,
            clinicId: cp.clinicId,
            userId: cp.userId
          })),
          sampleInvoices: sampleInvoices.map(inv => ({
            id: inv._id,
            invoice_id: inv.invoice_id,
            clinic_id: inv.clinic_id,
            total_amount: inv.total_amount,
            created_at: inv.created_at,
            status: inv.status
          }))
        }
      });
    } catch (error: any) {
      console.error('Error in debug endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };
}
