import { Schema, model, Document, Types } from 'mongoose';

export interface IConsentForm extends Document {
  patientId: Types.ObjectId; // Reference to patient
  clinicId: Types.ObjectId; // Reference to Clinic
  doctorId: Types.ObjectId;  // Reference to doctor
  procedureName: string;
  description: string;
  benefits: string;
  risks: string[];
  alternatives: string[];
  additionalNotes?: string;
  consentDate: Date;
  patientSignature: {
    signed: boolean;
    signedAt?: Date;
    signatureImage?: string; // base64 or URL to image
  };
  doctorSignature: {
    signed: boolean;
    signedAt?: Date;
    signatureImage?: string;
  };
  witnessSignature?: {
    signed: boolean;
    signedAt?: Date;
    name?: string;
    signatureImage?: string;
  };
  pdfUrl?: string; // Optional link to signed PDF
  createdAt: Date;
  updatedAt: Date;
}

const ConsentFormSchema = new Schema<IConsentForm>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: false },

    procedureName: { type: String, required: true },
    description: { type: String, required: true },
    benefits: { type: String, required: true },
    risks: { type: [String], required: true },
    alternatives: { type: [String], required: true },
    additionalNotes: { type: String },

    consentDate: { type: Date, required: true },

    patientSignature: {
      signed: { type: Boolean, required: true, default: false },
      signedAt: { type: Date },
      signatureImage: { type: String },
    },

    doctorSignature: {
      signed: { type: Boolean, required: true, default: false },
      signedAt: { type: Date },
      signatureImage: { type: String },
    },

    witnessSignature: {
      signed: { type: Boolean },
      signedAt: { type: Date },
      name: { type: String },
      signatureImage: { type: String },
    },

    pdfUrl: { type: String },
  },
  { timestamps: true }
);

export const ConsentForm = model<IConsentForm>('ConsentForm', ConsentFormSchema);
