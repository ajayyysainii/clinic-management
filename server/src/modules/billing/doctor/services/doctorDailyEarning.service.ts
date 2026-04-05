import mongoose from 'mongoose';
import { DoctorDailyEarning, IDoctorDailyEarning } from '../models/doctorDailyEarning.model';
import { DoctorPayoutConfig, PayoutModelType } from '../models/doctorPayoutConfig.model';
import Invoice from '../../patient/models/invoice.model';

export class DoctorDailyEarningService {

  /**
   * Create a daily earning record when an invoice is created
   */
  public async createDailyEarningRecord(
    doctorId: mongoose.Types.ObjectId,
    clinicId: mongoose.Types.ObjectId,
    invoiceId: mongoose.Types.ObjectId
  ): Promise<IDoctorDailyEarning | null> {
    try {
      console.log('💰 Creating daily earning record for invoice:', invoiceId);
      console.log('👨‍⚕️ Doctor ID:', doctorId);
      console.log('🏥 Clinic ID:', clinicId);

      // Get the invoice details
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        console.log('❌ Invoice not found:', invoiceId);
        return null;
      }
      console.log('📄 Invoice found:', {
        id: invoice._id,
        subtotal: invoice.subtotal,
        created_at: invoice.created_at,
        appointment_id: invoice.appointment_id
      });

      // Get the doctor's payout configuration
      const payoutConfig = await DoctorPayoutConfig.findOne({
        doctor_id: doctorId,
        clinic_id: clinicId,
      });

      if (!payoutConfig) {
        console.log('❌ No payout config found for doctor:', doctorId, 'clinic:', clinicId);
        return null;
      }
      console.log('💰 Payout config found:', {
        id: payoutConfig._id,
        model: payoutConfig.model,
        per_visit_percent: payoutConfig.per_visit_percent,
        hybrid_percent: payoutConfig.hybrid_percent,
        daily_rate: payoutConfig.daily_rate
      });

      // Calculate commission based on payout model
      let commissionPercentage = 0;
      let commissionAmount = 0;

      switch (payoutConfig.model) {
        case PayoutModelType.PER_VISIT:
          if (payoutConfig.per_visit_percent) {
            commissionPercentage = payoutConfig.per_visit_percent;
            commissionAmount = ((invoice.subtotal || 0) * commissionPercentage) / 100;
            console.log('💵 PER_VISIT commission calculated:', { percentage: commissionPercentage, amount: commissionAmount });
          }
          break;

        case PayoutModelType.HYBRID:
          if (payoutConfig.hybrid_percent) {
            commissionPercentage = payoutConfig.hybrid_percent;
            commissionAmount = ((invoice.subtotal || 0) * commissionPercentage) / 100;
            console.log('💵 HYBRID commission calculated:', { percentage: commissionPercentage, amount: commissionAmount });
          }
          break;

        case PayoutModelType.DAILY:
          if (payoutConfig.daily_rate) {
            // For daily rate, check if this is the first invoice of the day
            const today = new Date(invoice.created_at).toDateString();
            const todayInvoices = await Invoice.find({
              _id: { $in: payoutConfig.invoice_ids },
              clinic_id: clinicId,
              created_at: {
                $gte: new Date(today),
                $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
              }
            });

            // If this is the first invoice of the day, set commission as daily rate
            if (todayInvoices.length === 1) {
              commissionPercentage = 100; // 100% of daily rate
              commissionAmount = payoutConfig.daily_rate;
              console.log('💵 DAILY commission calculated:', { percentage: commissionPercentage, amount: commissionAmount });
            }
          }
          break;

        case PayoutModelType.SALARIED:
          // For salaried doctors, no commission per invoice
          commissionPercentage = 0;
          commissionAmount = 0;
          console.log('💵 SALARIED - no commission per invoice');
          break;

        case PayoutModelType.NONE:
        default:
          commissionPercentage = 0;
          commissionAmount = 0;
          console.log('💵 NONE - no commission');
          break;
      }

      console.log('💵 Final commission values:', { percentage: commissionPercentage, amount: commissionAmount });

      // Create the daily earning record
      const dailyEarningData = {
        doctor_id: doctorId,
        clinic_id: clinicId,
        doctor_payout_config_id: payoutConfig._id,
        invoice_id: invoiceId,
        invoice_date: invoice.created_at,
        invoice_amount: invoice.subtotal || 0,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        payout_model: payoutConfig.model,
        effective_from: payoutConfig.effective_from || new Date(),
      };

      console.log('📝 Creating daily earning record with data:', dailyEarningData);

      try {
        const dailyEarning = await DoctorDailyEarning.create(dailyEarningData);
        console.log('✅ Daily earning record created successfully:', {
          id: dailyEarning._id,
          doctor_id: dailyEarning.doctor_id,
          clinic_id: dailyEarning.clinic_id,
          invoice_id: dailyEarning.invoice_id,
          commission_amount: dailyEarning.commission_amount
        });

        // Verify the record was saved by fetching it back
        const savedRecord = await DoctorDailyEarning.findById(dailyEarning._id);
        if (savedRecord) {
          console.log('✅ Record verified in database:', savedRecord._id);
        } else {
          console.log('❌ Record not found in database after creation');
        }

        return dailyEarning;
      } catch (createError) {
        console.error('❌ Error during DoctorDailyEarning.create():', createError);
        if (createError instanceof Error) {
          console.error('❌ Error name:', createError.name);
          console.error('❌ Error message:', createError.message);
          console.error('❌ Error stack:', createError.stack);
        }
        throw createError; // Re-throw to be caught by outer try-catch
      }
    } catch (error) {
      console.error('❌ Error creating daily earning record:', error);
      console.error('❌ Error details:', {error});
      return null;
    }
  }

  /**
   * Get daily earnings for a doctor within a date range
   */
  public async getDoctorDailyEarnings(
    doctorId: string,
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const earnings = await DoctorDailyEarning.find({
        doctor_id: doctorId,
        clinic_id: clinicId,
        invoice_date: { $gte: startDate, $lte: endDate }
      })
      .populate('invoice_id', 'invoice_id total_amount status')
      .populate('doctor_payout_config_id', 'model effective_from')
      .sort({ invoice_date: -1 });

      return earnings;
    } catch (error) {
      console.error('Error fetching doctor daily earnings:', error);
      return [];
    }
  }

  /**
   * Get earnings summary for a doctor within a date range
   */
  public async getDoctorEarningsSummary(
    doctorId: string,
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const earnings = await DoctorDailyEarning.aggregate([
        {
          $match: {
            doctor_id: new mongoose.Types.ObjectId(doctorId),
            clinic_id: new mongoose.Types.ObjectId(clinicId),
            invoice_date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCommission: { $sum: '$commission_amount' },
            totalInvoices: { $sum: 1 },
            totalInvoiceAmount: { $sum: '$invoice_amount' },
            averageCommissionPercentage: { $avg: '$commission_percentage' }
          }
        }
      ]);

      return earnings[0] || {
        totalCommission: 0,
        totalInvoices: 0,
        totalInvoiceAmount: 0,
        averageCommissionPercentage: 0
      };
    } catch (error) {
      console.error('Error calculating earnings summary:', error);
      return {
        totalCommission: 0,
        totalInvoices: 0,
        totalInvoiceAmount: 0,
        averageCommissionPercentage: 0
      };
    }
  }

  /**
   * Get daily breakdown of earnings
   */
  public async getDailyBreakdown(
    doctorId: string,
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const breakdown = await DoctorDailyEarning.aggregate([
        {
          $match: {
            doctor_id: new mongoose.Types.ObjectId(doctorId),
            clinic_id: new mongoose.Types.ObjectId(clinicId),
            invoice_date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$invoice_date' } },
              payoutModel: '$payout_model'
            },
            totalCommission: { $sum: '$commission_amount' },
            totalInvoices: { $sum: 1 },
            totalInvoiceAmount: { $sum: '$invoice_amount' },
            commissionPercentage: { $first: '$commission_percentage' }
          }
        },
        {
          $sort: { '_id.date': -1 }
        }
      ]);

      return breakdown;
    } catch (error) {
      console.error('Error calculating daily breakdown:', error);
      return [];
    }
  }
}
