import mongoose, { Schema, model } from 'mongoose';

export enum StaffPayoutModelType {
  NONE = 'NONE',
  SALARIED = 'SALARIED',
}

export interface IStaffPayoutConfig {
  staff_id: mongoose.Types.ObjectId;
  clinic_id: mongoose.Types.ObjectId;
  model: string;
  fixed_salary?: number;
  effective_from?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const StaffPayoutConfigSchema = new Schema<IStaffPayoutConfig>({
  staff_id: {
    type: Schema.Types.ObjectId,
    ref: 'StaffMeta',
  },
  clinic_id: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
  },
  model: {
    type: String,
    enum: Object.values(StaffPayoutModelType),
  },
  fixed_salary: {
    type: Schema.Types.Decimal128,
    default: null,
    get: (v: any) => v == null ? null : parseFloat(v.toString()),
    set: (v: any) => v,
  },
  effective_from: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

export const StaffPayoutConfig = model<IStaffPayoutConfig>('StaffPayoutConfig', StaffPayoutConfigSchema);
