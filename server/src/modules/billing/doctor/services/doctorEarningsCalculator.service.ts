import { DoctorPayoutConfig } from '../models/doctorPayoutConfig.model';
import { PatientVisitDoctors, Status } from '../../../patient/models';
import Invoice from '../../patient/models/invoice.model';
import mongoose from 'mongoose';

export class DoctorEarningsCalculatorService {

  /**
   * Calculate doctor earnings for a date range
   */
  public async calculateDoctorEarnings(doctorId: string, clinicId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      console.log('🔍 Calculating earnings for doctor:', doctorId, 'clinic:', clinicId);
      console.log('📅 Date range:', startDate, 'to', endDate);

      // Get doctor's payout configuration
      const payoutConfig = await DoctorPayoutConfig.findOne({
        doctor_id: doctorId,
        clinic_id: clinicId,
      }).populate('invoice_ids');

      console.log('💰 Payout config found:', payoutConfig ? 'Yes' : 'No');
      if (payoutConfig) {
        console.log('📊 Payout model:', payoutConfig.model);
        console.log('📋 Invoice IDs in config:', payoutConfig.invoice_ids?.length || 0);
      }

      if (!payoutConfig) {
        console.log('⚠️ No payout config found, returning zero earnings');
        return {
          total_earnings: 0,
          total_revenue: 0,
          total_appointments: 0,
          completed_appointments: 0,
          daily_breakdown: [],
          payout_model: 'NONE'
        };
      }

      // Get invoices for the date range
      console.log('🔍 Looking for invoices with IDs:', payoutConfig.invoice_ids?.length || 0);
      const invoices = await Invoice.find({
        _id: { $in: payoutConfig.invoice_ids },
        created_at: { $gte: startDate, $lte: endDate }
      });
      console.log('📋 Found invoices in date range:', invoices.length);

      // Group invoices by date
      const dailyInvoices = this.groupInvoicesByDate(invoices);
      console.log('📅 Daily invoice groups:', Object.keys(dailyInvoices).length);

      // Calculate daily earnings
      const dailyBreakdown = [];
      let totalEarnings = 0;
      let totalRevenue = 0;
      let totalAppointments = 0;
      let completedAppointments = 0;

      for (const [date, dayInvoices] of Object.entries(dailyInvoices)) {
        console.log('📅 Processing date:', date, 'with', dayInvoices.length, 'invoices');
        const dayRevenue = dayInvoices.reduce((sum: number, inv: any) => sum + (inv.subtotal || 0), 0);
        const dayEarnings = this.calculateDayEarnings(payoutConfig, dayRevenue, dayInvoices.length);
        console.log('💰 Day revenue:', dayRevenue, 'Day earnings:', dayEarnings);

        dailyBreakdown.push({
          date: new Date(date),
          revenue: dayRevenue,
          earnings: dayEarnings,
          appointments: dayInvoices.length,
          breakdown: this.getEarningsBreakdown(payoutConfig, dayRevenue, dayInvoices.length)
        });

        totalRevenue += dayRevenue;
        totalEarnings += dayEarnings;
        totalAppointments += dayInvoices.length;
        completedAppointments += dayInvoices.length; // All invoices are from completed appointments
      }

      console.log('📊 Final results - Total earnings:', totalEarnings, 'Total revenue:', totalRevenue);
      return {
        total_earnings: totalEarnings,
        total_revenue: totalRevenue,
        total_appointments: totalAppointments,
        completed_appointments: completedAppointments,
        daily_breakdown: dailyBreakdown,
        payout_model: payoutConfig.model
      };
    } catch (error) {
      throw new Error(`Failed to calculate doctor earnings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate clinic earnings for all doctors on a specific date
   */
  public async calculateClinicEarnings(clinicId: string, date: Date): Promise<any[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all payout configs for the clinic
      const payoutConfigs = await DoctorPayoutConfig.find({
        clinic_id: clinicId
      }).populate('doctor_id').populate('invoice_ids');

      const clinicEarnings = [];

      for (const config of payoutConfigs) {
        // Get invoices for this doctor on this date
        const invoices = await Invoice.find({
          _id: { $in: config.invoice_ids },
          created_at: { $gte: startOfDay, $lte: endOfDay }
        });

        const dayRevenue = invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
        const dayEarnings = this.calculateDayEarnings(config, dayRevenue, invoices.length);

        clinicEarnings.push({
          doctor_id: config.doctor_id,
          revenue: dayRevenue,
          earnings: dayEarnings,
          appointments: invoices.length,
          payout_model: config.model,
          breakdown: this.getEarningsBreakdown(config, dayRevenue, invoices.length)
        });
      }

      return clinicEarnings;
    } catch (error) {
      throw new Error(`Failed to calculate clinic earnings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Group invoices by date
   */
  private groupInvoicesByDate(invoices: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const invoice of invoices) {
      const date = new Date(invoice.created_at);
      const dateKey = date.toISOString().split('T')[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(invoice);
    }

    return grouped;
  }

  /**
   * Calculate earnings for a specific day based on payout model
   */
  private calculateDayEarnings(payoutConfig: any, revenue: number, appointmentCount: number): number {
    switch (payoutConfig.model) {
      case 'SALARIED':
        return (payoutConfig.fixed_salary || 0) / 30; // Daily salary portion

      case 'DAILY':
        return (payoutConfig.daily_rate || 0) * (appointmentCount > 0 ? 1 : 0);

      case 'PER_VISIT':
        const commissionRate = (payoutConfig.per_visit_percent || 0) / 100;
        return revenue * commissionRate;

      case 'HYBRID':
        const dailyFixedSalary = (payoutConfig.fixed_salary || 0) / 30;
        const hybridCommissionRate = (payoutConfig.hybrid_percent || 0) / 100;
        const hybridCommission = revenue * hybridCommissionRate;
        return dailyFixedSalary + hybridCommission;

      case 'NONE':
      default:
        return 0;
    }
  }

  /**
   * Get detailed breakdown of earnings
   */
  private getEarningsBreakdown(payoutConfig: any, revenue: number, appointmentCount: number): any {
    const breakdown = {
      fixed_salary_portion: 0,
      commission_portion: 0,
      daily_rate_portion: 0,
      hybrid_portion: 0
    };

    switch (payoutConfig.model) {
      case 'SALARIED':
        breakdown.fixed_salary_portion = (payoutConfig.fixed_salary || 0) / 30;
        break;

      case 'DAILY':
        breakdown.daily_rate_portion = (payoutConfig.daily_rate || 0) * (appointmentCount > 0 ? 1 : 0);
        break;

      case 'PER_VISIT':
        const commissionRate = (payoutConfig.per_visit_percent || 0) / 100;
        breakdown.commission_portion = revenue * commissionRate;
        break;

      case 'HYBRID':
        breakdown.fixed_salary_portion = (payoutConfig.fixed_salary || 0) / 30;
        const hybridCommissionRate = (payoutConfig.hybrid_percent || 0) / 100;
        breakdown.hybrid_portion = revenue * hybridCommissionRate;
        break;
    }

    return breakdown;
  }
}
