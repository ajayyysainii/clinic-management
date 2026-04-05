import mongoose, { Schema, model } from 'mongoose';

export enum PayoutModelType {
  NONE = 'NONE',
  SALARIED = 'SALARIED',
  PER_VISIT = 'PER_VISIT',
  DAILY = 'DAILY',
  HYBRID = 'HYBRID',
}

export interface IDoctorPayoutConfig {
  doctor_id: mongoose.Types.ObjectId;
  clinic_id: mongoose.Types.ObjectId;
  model: string;
  fixed_salary?: number;
  daily_rate?: number;
  per_visit_percent?: number;
  hybrid_percent?: number;
  effective_from?: Date;
  invoice_ids: mongoose.Types.ObjectId[]; // Array of invoice IDs
  amountEarned?: number; // Total amount earned by doctor based on payout configuration
  createdAt?: Date;
  updatedAt?: Date;
}

const DoctorPayoutConfigSchema = new Schema<IDoctorPayoutConfig>({
  doctor_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  clinic_id: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
  },
  model: {
    type: String,
    enum: Object.values(PayoutModelType),
  },
  fixed_salary: {
    type: Schema.Types.Decimal128,
    default: null,
    get: (v: any) => v == null ? null : parseFloat(v.toString()),
    set: (v: any) => v,
  },
  daily_rate: {
    type: Schema.Types.Decimal128,
    default: null,
    get: (v: any) => v == null ? null : parseFloat(v.toString()),
    set: (v: any) => v,
  },
  per_visit_percent: {
    type: Schema.Types.Decimal128,
    default: null,
    get: (v: any) => v == null ? null : parseFloat(v.toString()),
    set: (v: any) => v,
  },
  hybrid_percent: {
    type: Schema.Types.Decimal128,
    default: null,
    get: (v: any) => v == null ? null : parseFloat(v.toString()),
    set: (v: any) => v,
  },
  effective_from: {
    type: Date,
    default: null,
  },
  invoice_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
  }],
  amountEarned: {
    type: Schema.Types.Decimal128,
    default: 0,
    get: (v: any) => v == null ? 0 : parseFloat(v.toString()),
    set: (v: any) => v,
  },
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

export const DoctorPayoutConfig = model<IDoctorPayoutConfig>('DoctorPayoutConfig', DoctorPayoutConfigSchema);
