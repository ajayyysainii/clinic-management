import { Schema, model, Document, Types } from 'mongoose';

export interface IReferralForm extends Document {
  patientId: Types.ObjectId;
  clinicId: Types.ObjectId;
  referredBy: Types.ObjectId;
  referredTo?: {
    doctorId?: Types.ObjectId;
    name?: string;
    department?: string;
    hospital?: string;
    contact?: string;
  };
  reasonForReferral: string;
  provisionalDiagnosis: string;
  medicalHistory?: string;
  investigationsDone?: string[];
  instructions?: string;
  attachments?: string[]; // URLs or file names
  referralDate: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralFormSchema = new Schema<IReferralForm>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
    referredTo: {
      doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      department: { type: String },
      hospital: { type: String },
      contact: { type: String },
    },

    reasonForReferral: { type: String, required: true },
    provisionalDiagnosis: { type: String, required: true },
    medicalHistory: { type: String },
    investigationsDone: { type: [String], default: [] },
    instructions: { type: String },
    attachments: { type: [String], default: [] }, // file URLs or paths
    pdfUrl: { type: String },
    referralDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ReferralForm = model<IReferralForm>('ReferralForm', ReferralFormSchema);
