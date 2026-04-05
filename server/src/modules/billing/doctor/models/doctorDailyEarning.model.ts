import mongoose, { Schema, model } from 'mongoose';

export interface IDoctorDailyEarning {
  _id?: mongoose.Types.ObjectId;
  doctor_id: mongoose.Types.ObjectId;
  clinic_id: mongoose.Types.ObjectId;
  doctor_payout_config_id: mongoose.Types.ObjectId;
  invoice_id: mongoose.Types.ObjectId;
  invoice_date: Date;
  invoice_amount: number;
  commission_percentage: number;
  commission_amount: number;
  payout_model: string;
  effective_from: Date; // When this payout config was effective
  created_at: Date;
  updated_at: Date;
}

const DoctorDailyEarningSchema = new Schema<IDoctorDailyEarning>({
  doctor_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  clinic_id: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true,
  },
  doctor_payout_config_id: {
    type: Schema.Types.ObjectId,
    ref: 'DoctorPayoutConfig',
    required: true,
    index: true,
  },
  invoice_id: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true,
  },
  invoice_date: {
    type: Date,
    required: true,
    index: true,
  },
  invoice_amount: {
    type: Number,
    required: true,
  },
  commission_percentage: {
    type: Number,
    required: true,
  },
  commission_amount: {
    type: Number,
    required: true,
  },
  payout_model: {
    type: String,
    enum: ['NONE', 'SALARIED', 'PER_VISIT', 'DAILY', 'HYBRID'],
    required: true,
  },
  effective_from: {
    type: Date,
    required: true,
    index: true,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { getters: true },
  toObject: { getters: true },
});

// Compound indexes for better query performance
DoctorDailyEarningSchema.index({ doctor_id: 1, clinic_id: 1, invoice_date: 1 });
DoctorDailyEarningSchema.index({ doctor_id: 1, clinic_id: 1, effective_from: 1 });
DoctorDailyEarningSchema.index({ invoice_date: 1, clinic_id: 1 });

export const DoctorDailyEarning = model<IDoctorDailyEarning>('DoctorDailyEarning', DoctorDailyEarningSchema);
