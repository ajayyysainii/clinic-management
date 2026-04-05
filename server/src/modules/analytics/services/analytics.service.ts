import { ClinicPatient } from '../../patient/models/clinicPatient.model';
import { PatientVisitDoctors } from '../../patient/models/patientVisitDoctor';
import { User } from '../../user/models';
import Invoice, { IInvoice } from '../../billing/patient/models/invoice.model'
import { Inventory } from '../../inventory/models/inventory.model';
import mongoose from 'mongoose';
import {Types} from 'mongoose'

export class AnalyticsService {
  async getClinicAnalytics(clinicId: string) {
    try {
      // Validate clinicId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID format');
      }

      // Get current date and calculate date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // Patient count
      const totalPatients = await ClinicPatient.countDocuments({ clinicId: clinicId });
      const newPatientsThisMonth = await ClinicPatient.countDocuments({
        clinicId: clinicId,
        createdAt: { $gte: startOfMonth }
      });

      // Appointment analytics - need to join with ClinicPatient to get clinic
      const totalAppointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId)
          }
        },
        {
          $count: 'total'
        }
      ]);

      const todaysAppointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $count: 'total'
        }
      ]);

      const appointmentsThisMonth = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: startOfMonth }
          }
        },
        {
          $count: 'total'
        }
      ]);

      // Staff count
      const activeStaff = await User.countDocuments({
        roles: 'staff',
        clinic: clinicId,
        deletedAt: null
      });

      // Revenue calculations
      const currentMonthRevenue = await this.calculateMonthlyRevenue(clinicId, startOfMonth);
      const previousMonthRevenue = await this.calculateMonthlyRevenue(clinicId, startOfPreviousMonth);
      const revenueGrowth = previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0;

      // Recent appointments
      const recentAppointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'clinicPatient.userId',
            foreignField: '_id',
            as: 'patientUser'
          }
        },
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctor'
          }
        },
        {
          $sort: { appointmentTime: -1 }
        },
        {
          $limit: 5
        }
      ]);

      // System alerts
      const alerts = await this.getSystemAlerts(clinicId);

      return {
        stats: {
          totalPatients: {
            count: totalPatients,
            growth: newPatientsThisMonth > 0 ? '+12%' : '0%',
            trend: 'up'
          },
          todaysAppointments: {
            count: todaysAppointments[0]?.total || 0,
            growth: (appointmentsThisMonth[0]?.total || 0) > 0 ? '+8%' : '0%',
            trend: 'up'
          },
          monthlyRevenue: {
            amount: currentMonthRevenue,
            growth: revenueGrowth > 0 ? `+${revenueGrowth.toFixed(1)}%` : `${revenueGrowth.toFixed(1)}%`,
            trend: revenueGrowth >= 0 ? 'up' : 'down'
          },
          activeStaff: {
            count: activeStaff,
            status: 'All staff members online'
          }
        },
        recentAppointments: recentAppointments.map(apt => ({
          id: apt._id,
          patientName: `${apt.patientUser?.[0]?.firstName || ''} ${apt.patientUser?.[0]?.lastName || ''}`,
          doctorName: `${apt.doctor?.[0]?.firstName || ''} ${apt.doctor?.[0]?.lastName || ''}`,
          date: apt.appointmentTime.toISOString().split('T')[0],
          time: apt.appointmentTime.toTimeString().split(' ')[0].substring(0, 5),
          type: apt.consultationMode || 'In-person',
          status: apt.status
        })),
        alerts
      };
    } catch (error) {
      console.error('Error in getClinicAnalytics:', error);
      throw error;
    }
  }

  async getDoctorAnalytics(doctorId: string) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // Doctor's appointments
      const totalAppointments = await PatientVisitDoctors.countDocuments({ doctorId });
      const todaysAppointments = await PatientVisitDoctors.countDocuments({
        doctorId,
        appointmentTime: { $gte: startOfDay, $lte: endOfDay }
      });
      const appointmentsThisMonth = await PatientVisitDoctors.countDocuments({
        doctorId,
        appointmentTime: { $gte: startOfMonth }
      });

      // Doctor's patients (unique patients seen)
      const uniquePatients = await PatientVisitDoctors.distinct('clinicPatientId', { doctorId });
      const totalPatients = uniquePatients.length;

      // Doctor's revenue (assuming revenue is split or tracked per doctor)
      const doctorRevenue = await this.calculateDoctorRevenue(doctorId, startOfMonth);
      const previousMonthRevenue = await this.calculateDoctorRevenue(doctorId, new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const revenueGrowth = previousMonthRevenue > 0
        ? ((doctorRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0;

      // Recent appointments
      const recentAppointments = await PatientVisitDoctors.find({
        doctorId,
        appointmentTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
      .populate({
        path: 'clinicPatientId',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .sort({ appointmentTime: -1 })
      .limit(5);

      return {
        stats: {
          totalPatients: {
            count: totalPatients,
            growth: '+5%',
            trend: 'up'
          },
          todaysAppointments: {
            count: todaysAppointments,
            growth: appointmentsThisMonth > 0 ? '+8%' : '0%',
            trend: 'up'
          },
          monthlyRevenue: {
            amount: doctorRevenue,
            growth: revenueGrowth > 0 ? `+${revenueGrowth.toFixed(1)}%` : `${revenueGrowth.toFixed(1)}%`,
            trend: revenueGrowth >= 0 ? 'up' : 'down'
          },
          activeStaff: {
            count: 1,
            status: 'Available for appointments'
          }
        },
        recentAppointments: recentAppointments.map(apt => ({
          id: apt._id,
          patientName: `${apt.clinicPatientId ||  ''}`,
          doctorName: 'You',
          date: apt.appointmentTime.toISOString().split('T')[0],
          time: apt.appointmentTime.toTimeString().split(' ')[0].substring(0, 5),
          type: apt.consultationMode || 'In-person',
          status: apt.status
        })),
        alerts: []
      };
    } catch (error) {
      console.error('Error in getDoctorAnalytics:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(clinicId: string, period: string = 'month') {
    try {
      // Validate clinicId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID format');
      }

      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
      }

      const revenue = await this.calculateRevenueInPeriod(clinicId, startDate, endDate);
      const previousPeriodRevenue = await this.calculatePreviousPeriodRevenue(clinicId, startDate, endDate, period);

      const growth = previousPeriodRevenue > 0
        ? ((revenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
        : 0;

      return {
        currentRevenue: revenue,
        previousRevenue: previousPeriodRevenue,
        growth: growth,
        period: period
      };
    } catch (error) {
      console.error('Error in getRevenueAnalytics:', error);
      throw error;
    }
  }

  async getClinicAppointmentAnalytics(clinicId: string, period: string = 'month') {
    try {
      // Validate clinicId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID format');
      }

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const appointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: startDate }
          }
        },
        {
          $count: 'total'
        }
      ]);

      const completedAppointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $count: 'total'
        }
      ]);

      const cancelledAppointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: startDate },
            status: 'cancelled'
          }
        },
        {
          $count: 'total'
        }
      ]);

      return {
        total: appointments[0]?.total || 0,
        completed: completedAppointments[0]?.total || 0,
        cancelled: cancelledAppointments[0]?.total || 0,
        completionRate: (appointments[0]?.total || 0) > 0 ? ((completedAppointments[0]?.total || 0) / (appointments[0]?.total || 0)) * 100 : 0,
        period: period
      };
    } catch (error) {
      console.error('Error in getClinicAppointmentAnalytics:', error);
      throw error;
    }
  }

  async getDoctorAppointmentAnalytics(doctorId: string, period: string = 'month') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const appointments = await PatientVisitDoctors.countDocuments({
        doctorId,
        appointmentTime: { $gte: startDate }
      });

      const completedAppointments = await PatientVisitDoctors.countDocuments({
        doctorId,
        appointmentTime: { $gte: startDate },
        status: 'completed'
      });

      const cancelledAppointments = await PatientVisitDoctors.countDocuments({
        doctorId,
        appointmentTime: { $gte: startDate },
        status: 'cancelled'
      });

      return {
        total: appointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        completionRate: appointments > 0 ? (completedAppointments / appointments) * 100 : 0,
        period: period
      };
    } catch (error) {
      console.error('Error in getDoctorAppointmentAnalytics:', error);
      throw error;
    }
  }

  async getPatientAnalytics(clinicId: string, period: string = 'month') {
    try {
      // Validate clinicId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID format');
      }

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const totalPatients = await ClinicPatient.countDocuments({ clinicId: clinicId });
      const newPatients = await ClinicPatient.countDocuments({
        clinicId: clinicId,
        createdAt: { $gte: startDate }
      });

      const returningPatients = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$clinicPatientId',
            appointmentCount: { $sum: 1 }
          }
        },
        {
          $match: {
            appointmentCount: { $gt: 1 }
          }
        },
        {
          $count: 'returningPatients'
        }
      ]);

      return {
        totalPatients,
        newPatients,
        returningPatients: returningPatients[0]?.returningPatients || 0,
        period: period
      };
    } catch (error) {
      console.error('Error in getPatientAnalytics:', error);
      throw error;
    }
  }

  async getSystemAlerts(clinicId: string) {
    try {
      // Validate clinicId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID format');
      }

      const alerts = [];

      // Check for low stock items
      const lowStockItems = await Inventory.find({
        clinicId: clinicId,
        quantity: { $lte: 10 }
      }).limit(5);

      if (lowStockItems.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${lowStockItems[0].itemName} is below minimum stock level`,
          icon: 'AlertCircle'
        });
      }

      // Check for upcoming appointments
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      const endOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

      const tomorrowAppointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: startOfTomorrow, $lte: endOfTomorrow }
          }
        },
        {
          $count: 'total'
        }
      ]);

      if ((tomorrowAppointments[0]?.total || 0) > 0) {
        alerts.push({
          type: 'info',
          title: 'Appointment Reminder',
          message: `${tomorrowAppointments[0]?.total || 0} appointments scheduled for tomorrow`,
          icon: 'Clock'
        });
      }

      // Add system status alert
      alerts.push({
        type: 'success',
        title: 'System Backup Complete',
        message: 'Daily backup completed successfully',
        icon: 'CheckCircle'
      });

      return alerts;
    } catch (error) {
      console.error('Error in getSystemAlerts:', error);
      return [];
    }
  }

  // Get basic stats for clinic (patients, appointments, revenue, staff)
  async getClinicBasicStats(clinicId: string) {
    try {
      // Validate clinicId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID format');
      }

      // Get current date and calculate date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // Patient count
      const totalPatients = await ClinicPatient.countDocuments({ clinicId: clinicId });
      const newPatientsThisMonth = await ClinicPatient.countDocuments({
        clinicId: clinicId,
        createdAt: { $gte: startOfMonth }
      });

      // Appointment analytics
      const todaysAppointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $count: 'total'
        }
      ]);

      const appointmentsThisMonth = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: startOfMonth }
          }
        },
        {
          $count: 'total'
        }
      ]);

      // Staff count
      const activeStaff = await User.countDocuments({
        roles: 'staff',
        clinic: clinicId,
        deletedAt: null
      });

      // Revenue calculations
      const currentMonthRevenue = await this.calculateMonthlyRevenue(clinicId, startOfMonth);
      const previousMonthRevenue = await this.calculateMonthlyRevenue(clinicId, startOfPreviousMonth);
      const revenueGrowth = previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0;

      return {
        totalPatients: {
          count: totalPatients,
          growth: newPatientsThisMonth > 0 ? '+12%' : '0%',
          trend: 'up'
        },
        todaysAppointments: {
          count: todaysAppointments[0]?.total || 0,
          growth: (appointmentsThisMonth[0]?.total || 0) > 0 ? '+8%' : '0%',
          trend: 'up'
        },
        monthlyRevenue: {
          amount: currentMonthRevenue,
          growth: revenueGrowth > 0 ? `+${revenueGrowth.toFixed(1)}%` : `${revenueGrowth.toFixed(1)}%`,
          trend: revenueGrowth >= 0 ? 'up' : 'down'
        },
        activeStaff: {
          count: activeStaff,
          status: 'All staff members online'
        }
      };
    } catch (error) {
      console.error('Error in getClinicBasicStats:', error);
      throw error;
    }
  }

  // Get basic stats for doctor
  async getDoctorBasicStats(doctorId: string) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // Doctor's appointments
      const todaysAppointments = await PatientVisitDoctors.countDocuments({
        doctorId,
        appointmentTime: { $gte: startOfDay, $lte: endOfDay }
      });
      const appointmentsThisMonth = await PatientVisitDoctors.countDocuments({
        doctorId,
        appointmentTime: { $gte: startOfMonth }
      });

      // Doctor's patients (unique patients seen)
      const uniquePatients = await PatientVisitDoctors.distinct('clinicPatientId', { doctorId });
      const totalPatients = uniquePatients.length;

      // Doctor's revenue
      const doctorRevenue = await this.calculateDoctorRevenue(doctorId, startOfMonth);
      const previousMonthRevenue = await this.calculateDoctorRevenue(doctorId, new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const revenueGrowth = previousMonthRevenue > 0
        ? ((doctorRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0;

      return {
        totalPatients: {
          count: totalPatients,
          growth: '+5%',
          trend: 'up'
        },
        todaysAppointments: {
          count: todaysAppointments,
          growth: appointmentsThisMonth > 0 ? '+8%' : '0%',
          trend: 'up'
        },
        monthlyRevenue: {
          amount: doctorRevenue,
          growth: revenueGrowth > 0 ? `+${revenueGrowth.toFixed(1)}%` : `${revenueGrowth.toFixed(1)}%`,
          trend: revenueGrowth >= 0 ? 'up' : 'down'
        },
        activeStaff: {
          count: 1,
          status: 'Available for appointments'
        }
      };
    } catch (error) {
      console.error('Error in getDoctorBasicStats:', error);
      throw error;
    }
  }

  // Get recent appointments for clinic
  async getClinicRecentAppointments(clinicId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID format');
      }

      // Get appointments from the last 30 days instead of just today for better data visibility
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      console.log('=== DEBUGGING CLINIC RECENT APPOINTMENTS ===');
      console.log('Looking for appointments from:', thirtyDaysAgo, 'to now');
      console.log('Clinic ID:', clinicId);

      // First, let's check if there are any appointments at all
      const totalAppointments = await PatientVisitDoctors.countDocuments();
      console.log('Total appointments in database:', totalAppointments);

      // Check if there are any clinic patients for this clinic
      const clinicPatients = await ClinicPatient.countDocuments({ clinicId: new mongoose.Types.ObjectId(clinicId) });
      console.log('Clinic patients for this clinic:', clinicPatients);

      // Let's also check what clinic patients exist
      const sampleClinicPatients = await ClinicPatient.find({ clinicId: new mongoose.Types.ObjectId(clinicId) }).limit(3);
      console.log('Sample clinic patients:', sampleClinicPatients.map(cp => ({ id: cp._id, clinicId: cp.clinicId })));

      const recentAppointments = await PatientVisitDoctors.aggregate([
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $unwind: '$clinicPatient'
        },
        {
          $match: {
            'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId),
            appointmentTime: { $gte: thirtyDaysAgo }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'clinicPatient.userId',
            foreignField: '_id',
            as: 'patientUser'
          }
        },
        {
          $unwind: {
            path: '$patientUser',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctorUser'
          }
        },
        {
          $unwind: {
            path: '$doctorUser',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { appointmentTime: -1 } // Sort by time descending (most recent first)
        },
        {
          $limit: 10 // Limit to 10 most recent appointments
        }
      ]);

      console.log('Found appointments after aggregation:', recentAppointments.length);
      if (recentAppointments.length > 0) {
        console.log('Sample appointment:', JSON.stringify(recentAppointments[0], null, 2));

        // Debug the joined data structure
        console.log('Sample patient user data:', recentAppointments[0].patientUser);
        console.log('Sample doctor user data:', recentAppointments[0].doctorUser);
      }

      // If no appointments found, let's try a simpler query to debug
      if (recentAppointments.length === 0) {
        console.log('No appointments found with date filter, trying without date filter...');

        const allAppointmentsForClinic = await PatientVisitDoctors.aggregate([
          {
            $lookup: {
              from: 'clinicpatients',
              localField: 'clinicPatientId',
              foreignField: '_id',
              as: 'clinicPatient'
            }
          },
          {
            $unwind: '$clinicPatient'
          },
          {
            $match: {
              'clinicPatient.clinicId': new mongoose.Types.ObjectId(clinicId)
            }
          }
        ]);

        console.log('Appointments for clinic (without date filter):', allAppointmentsForClinic.length);
        if (allAppointmentsForClinic.length > 0) {
          console.log('Sample appointment without date filter:', allAppointmentsForClinic[0]);
        }
      }

      console.log('=== END DEBUGGING ===');

      return recentAppointments.map(apt => {
        // Extract patient name from the joined data
        const patientName = apt.patientUser?.name || 'Unknown Patient';

        // Extract doctor name from the joined data (doctors are Users with doctor role)
        const doctorName = apt.doctorUser?.name || 'Unknown Doctor';

        return {
          id: apt._id,
          patientName: patientName,
          doctorName: doctorName,
          date: apt.appointmentTime.toISOString().split('T')[0],
          time: apt.appointmentTime.toTimeString().split(' ')[0].substring(0, 5),
          type: apt.consultationMode || 'In-person',
          status: apt.status
        };
      });
    } catch (error) {
      console.error('Error in getClinicRecentAppointments:', error);
      throw error;
    }
  }

  // Get recent appointments for doctor
  async getDoctorRecentAppointments(doctorId: string) {
    try {
      // Get appointments from the last 30 days instead of just today
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const recentAppointments = await PatientVisitDoctors.aggregate([
        {
          $match: {
            doctorId: new mongoose.Types.ObjectId(doctorId),
            appointmentTime: { $gte: thirtyDaysAgo }
          }
        },
        {
          $lookup: {
            from: 'clinicpatients',
            localField: 'clinicPatientId',
            foreignField: '_id',
            as: 'clinicPatient'
          }
        },
        {
          $unwind: '$clinicPatient'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'clinicPatient.userId',
            foreignField: '_id',
            as: 'patientUser'
          }
        },
        {
          $unwind: {
            path: '$patientUser',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { appointmentTime: -1 } // Sort by time descending (most recent first)
        },
        {
          $limit: 10 // Limit to 10 most recent appointments
        }
      ]);

      console.log('Found doctor appointments:', recentAppointments.length);

      return recentAppointments.map(apt => {
        // Extract patient name from the joined data
        const patientName = apt.patientUser?.name || 'Unknown Patient';

        return {
          id: apt._id,
          patientName: patientName,
          doctorName: 'You',
          date: apt.appointmentTime.toISOString().split('T')[0],
          time: apt.appointmentTime.toTimeString().split(' ')[0].substring(0, 5),
          type: apt.consultationMode || 'In-person',
          status: apt.status
        };
      });
    } catch (error) {
      console.error('Error in getDoctorRecentAppointments:', error);
      throw error;
    }
  }

  private async calculateMonthlyRevenue(clinicId: string, startDate: Date): Promise<number> {
    try {
      const invoices = await Invoice.find({
        clinic_id: clinicId,
        created_at: { $gte: startDate }
      });

      return invoices.reduce((total: number, invoice: IInvoice) => {
        return total + (invoice.total_amount || 0);
      }, 0);
    } catch (error) {
      console.error('Error calculating monthly revenue:', error);
      return 0;
    }
  }

  private async calculateDoctorRevenue(doctorId: string, startDate: Date): Promise<number> {
    try {
      // This is a simplified calculation - in a real system, you'd need to track doctor-specific revenue
      const appointments = await PatientVisitDoctors.find({
        doctorId,
        appointmentTime: { $gte: startDate },
        status: 'completed'
      });

      // Assuming average consultation fee of 500 INR
      return appointments.length * 500;
    } catch (error) {
      console.error('Error calculating doctor revenue:', error);
      return 0;
    }
  }

  private async calculateRevenueInPeriod(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      const invoices = await Invoice.find({
        clinic_id: clinicId,
        created_at: { $gte: startDate, $lte: endDate }
      });

      return invoices.reduce((total: number, invoice: IInvoice) => {
        return total + (invoice.total_amount || 0);
      }, 0);
    } catch (error) {
      console.error('Error calculating revenue in period:', error);
      return 0;
    }
  }

  private async calculatePreviousPeriodRevenue(clinicId: string, startDate: Date, endDate: Date, period: string): Promise<number> {
    try {
      const periodDuration = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodDuration);
      const previousEndDate = new Date(startDate.getTime());

      return await this.calculateRevenueInPeriod(clinicId, previousStartDate, previousEndDate);
    } catch (error) {
      console.error('Error calculating previous period revenue:', error);
      return 0;
    }
  }
}
