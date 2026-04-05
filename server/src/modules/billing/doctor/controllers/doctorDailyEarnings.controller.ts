import { Request, Response } from 'express';
import { DoctorEarningsCalculatorService } from '../services/doctorEarningsCalculator.service';
import { DoctorDailyEarningService } from '../services/doctorDailyEarning.service';
import { AuthenticatedRequest } from '../../../../types';
import { DoctorPayoutConfig } from '../models';

export class DoctorDailyEarningsController {
  private earningsCalculatorService: DoctorEarningsCalculatorService;
  private dailyEarningService: DoctorDailyEarningService;

  constructor() {
    this.earningsCalculatorService = new DoctorEarningsCalculatorService();
    this.dailyEarningService = new DoctorDailyEarningService();
  }

  /**
   * Create doctor payout configuration
   */
  public async createDoctorPayoutConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clinic_id = req.currentUser?.clinic;
      const { doctor_id } = req.params;
      const payoutData = req.body;

      // Import the model dynamically to avoid circular dependencies
      const { DoctorPayoutConfig } = await import('../models/doctorPayoutConfig.model');

      const payoutConfig = await DoctorPayoutConfig.create({
        doctor_id,
        clinic_id,
        ...payoutData
      });

      res.status(201).json({
        success: true,
        data: payoutConfig
      });
    } catch (error) {
      console.error('Error creating doctor payout config:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * List doctor payout configurations
   */
  public async listDoctorPayoutConfigs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserClinic = req.currentUser?.clinic;

      if (!currentUserClinic) {

        res.status(400).json({
          success: false,
          error: 'User is not associated with any clinic'
        });
        return;
      }

      // Try to find by ObjectId first, then by string if that fails
      let payoutConfigs = await DoctorPayoutConfig.find({ clinic_id: currentUserClinic })
        .populate('doctor_id')
        .populate('clinic_id');

      // If no results, try with string comparison (in case clinic_id is stored as string)
      if (payoutConfigs.length === 0) {

        payoutConfigs = await DoctorPayoutConfig.find({ clinic_id: currentUserClinic })
          .populate('doctor_id', 'name email')
          .populate('clinic_id', 'name');
      }

      res.status(200).json({
        success: true,
        data: payoutConfigs
      });
    } catch (error) {
      console.error('Error listing doctor payout configs:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get doctor earnings
   */
  public async getDoctorEarnings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { startDate, endDate } = req.query;
      const currentUserClinic = req.currentUser?.clinic;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      if (!currentUserClinic) {
        res.status(400).json({ error: 'User is not associated with any clinic' });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const earnings = await this.earningsCalculatorService.calculateDoctorEarnings(
        doctor_id,
        currentUserClinic.toString(),
        start,
        end
      );

      res.status(200).json({
        success: true,
        data: earnings
      });
    } catch (error) {
      console.error('Error getting doctor earnings:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Calculate doctor earnings
   */
  public async calculateDoctorEarnings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { startDate, endDate } = req.query;
      const currentUserClinic = req.currentUser?.clinic;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      if (!currentUserClinic) {
        res.status(400).json({ error: 'User is not associated with any clinic' });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const earnings = await this.earningsCalculatorService.calculateDoctorEarnings(
        doctor_id,
        currentUserClinic.toString(),
        start,
        end
      );

      res.status(200).json({
        success: true,
        data: earnings
      });
    } catch (error) {
      console.error('Error calculating doctor earnings:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get daily earnings for a specific doctor
   */
  public async getDoctorDailyEarnings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clinicId = req.currentUser?.clinic;
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      console.log('🚀 API Call - getDoctorDailyEarnings');
      console.log('👨‍⚕️ Doctor ID:', doctorId);
      console.log('🏥 Clinic ID:', clinicId);
      console.log('📅 Start Date:', startDate);
      console.log('📅 End Date:', endDate);

      if (!startDate || !endDate) {
        console.log('❌ Missing start or end date');
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      if (!clinicId) {
        console.log('❌ Missing clinic ID');
        res.status(400).json({ error: 'Clinic ID is required' });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Import the model dynamically to avoid circular dependencies
      const { DoctorDailyEarning } = await import('../models/doctorDailyEarning.model');

      console.log('🔄 Fetching data from DoctorDailyEarning model...');
      const earnings = await DoctorDailyEarning.find({
        doctor_id: doctorId,
        clinic_id: clinicId,
        invoice_date: {
          $gte: start,
          $lte: end
        }
      }).populate('invoice_id', 'invoice_number patient_name')
         .populate('doctor_payout_config_id', 'payout_model commission_percentage')
         .sort({ invoice_date: 1 });

      console.log('✅ Data fetched from model successfully');
      res.status(200).json({
        success: true,
        data: earnings
      });
    } catch (error) {
      console.error('❌ Error in getDoctorDailyEarnings:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get earnings summary for a doctor
   */
  public async getDoctorEarningsSummary(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId, clinicId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (!clinicId) {
        res.status(400).json({ error: 'Clinic ID is required' });
        return;
      }

      const summary = await this.earningsCalculatorService.calculateDoctorEarnings(
        doctorId,
        clinicId.toString(),
        start,
        end
      );

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get detailed daily earnings for a doctor
   */
  public async getDetailedDailyEarnings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clinicId = req.currentUser?.clinic;
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      console.log('🚀 API Call - getDetailedDailyEarnings');
      console.log('👨‍⚕️ Doctor ID:', doctorId);
      console.log('🏥 Clinic ID:', clinicId);
      console.log('📅 Start Date:', startDate);
      console.log('📅 End Date:', endDate);

      if (!startDate || !endDate) {
        console.log('❌ Missing start or end date');
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      if (!clinicId) {
        console.log('❌ Missing clinic ID');
        res.status(400).json({ error: 'Clinic ID is required' });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Import the model dynamically to avoid circular dependencies
      const { DoctorDailyEarning } = await import('../models/doctorDailyEarning.model');

      console.log('🔄 Fetching data from DoctorDailyEarning model...');
      const earnings = await DoctorDailyEarning.find({
        doctor_id: doctorId,
        clinic_id: clinicId,

      }).populate('invoice_id', 'invoice_number patient_name')
         .populate('doctor_payout_config_id', 'payout_model commission_percentage')
         .sort({ invoice_date: 1 });

      console.log('✅ Data fetched from model successfully');
      res.status(200).json({
        success: true,
        data: earnings
      });
    } catch (error) {
      console.error('❌ Error in getDetailedDailyEarnings:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Calculate daily earnings for a doctor
   */
  public async calculateDailyEarnings(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId, clinicId } = req.params;
      const { date } = req.body;

      if (!date) {
        res.status(400).json({ error: 'Date is required' });
        return;
      }

      const targetDate = new Date(date);
      const earnings = await this.earningsCalculatorService.calculateDoctorEarnings(
        doctorId,
        clinicId,
        targetDate,
        targetDate
      );

      res.status(200).json({
        success: true,
        data: earnings
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get all doctors' daily earnings for a clinic on a specific date
   */
  public async getClinicDailyEarnings(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req.params;
      const { date } = req.query;

      if (!date) {
        res.status(400).json({ error: 'Date is required' });
        return;
      }

      const targetDate = new Date(date as string);
      const earnings = await this.earningsCalculatorService.calculateClinicEarnings(
        clinicId,
        targetDate
      );

      res.status(200).json({
        success: true,
        data: earnings
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Manual trigger to calculate earnings for a specific date
   */
  public async calculateEarningsManual(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId, clinicId, startDate, endDate } = req.body;

      if (!doctorId || !clinicId || !startDate || !endDate) {
        res.status(400).json({ error: 'Doctor ID, Clinic ID, start date, and end date are required' });
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const earnings = await this.earningsCalculatorService.calculateDoctorEarnings(
        doctorId,
        clinicId,
        start,
        end
      );

      res.status(200).json({
        success: true,
        data: {
          message: 'Earnings calculated successfully',
          earnings
        }
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}
