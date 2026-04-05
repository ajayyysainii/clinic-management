import { Schema, model, Document, Types } from 'mongoose';

export enum CertificateType {
  SICKNESS = 'sickness',
  FITNESS = 'fitness'
}

export enum FitnessType {
  WORK = 'work',
  SCHOOL = 'school',
  PHYSICAL_ACTIVITY = 'physical_activity',
  TRAVEL = 'travel',
  CUSTOM = 'custom'
}

export interface ICertificate extends Document {
  patientId: Types.ObjectId;
  clinicId: Types.ObjectId;
  doctorId: Types.ObjectId;
  certificateType: CertificateType;

  // Patient details (auto-filled)
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientIdString: string;

  // Doctor details (auto-filled)
  doctorName: string;
  doctorQualification: string;
  doctorRegNumber: string;

  // Clinic details (auto-filled)
  clinicName: string;
  clinicLogo?: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;

  // Certificate specific fields
  diagnosis: string;
  startDate: Date;
  endDate?: Date;
  numberOfDays?: number;
  isUnfit: boolean; // true for sickness, false for fitness

  // Fitness certificate specific
  fitnessTypes?: FitnessType[];
  customFitnessType?: string;
  examinationDate?: Date;
  isOnMedication?: boolean;
  isStable?: boolean;

  // Common fields
  remarks?: string;
  issuedDate: Date;
  place: string;
  pdfUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    certificateType: {
      type: String,
      enum: Object.values(CertificateType),
      required: true
    },

    // Patient details
    patientName: { type: String, required: true },
    patientAge: { type: Number, required: true },
    patientGender: { type: String, required: true },
    patientIdString: { type: String, required: true },

    // Doctor details
    doctorName: { type: String, required: true },
    doctorQualification: { type: String, required: true },
    doctorRegNumber: { type: String, required: true },

    // Clinic details
    clinicName: { type: String, required: true },
    clinicLogo: { type: String },
    clinicAddress: { type: String, required: true },
    clinicPhone: { type: String, required: true },
    clinicEmail: { type: String, required: true },

    // Certificate specific fields
    diagnosis: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    numberOfDays: { type: Number },
    isUnfit: { type: Boolean, required: true },

    // Fitness certificate specific
    fitnessTypes: [{
      type: String,
      enum: Object.values(FitnessType)
    }],
    customFitnessType: { type: String },
    examinationDate: { type: Date },
    isOnMedication: { type: Boolean },
    isStable: { type: Boolean },

    // Common fields
    remarks: { type: String },
    issuedDate: { type: Date, default: Date.now },
    place: { type: String, required: true },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

// Indexes for better query performance
CertificateSchema.index({ patientId: 1, certificateType: 1 });
CertificateSchema.index({ clinicId: 1, certificateType: 1 });
CertificateSchema.index({ doctorId: 1, certificateType: 1 });
CertificateSchema.index({ issuedDate: -1 });

export const Certificate = model<ICertificate>('Certificate', CertificateSchema);
