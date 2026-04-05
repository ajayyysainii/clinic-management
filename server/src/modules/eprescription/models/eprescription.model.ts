import { Schema, model, Document, Types } from "mongoose";

interface Vitals {
  BP: string;
  PR: string;
  SpO2: string;
}

interface PrescribedMedication {
  drugName: string;
  freequency: string;
  duration: string;
  quantity: string;
}

interface Diagnosis {
  diagnosisName: string;
  dateOfDiagnosis: Date;
}



export interface EPrescriptionDocument extends Document {
  link: string;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  clinic: Types.ObjectId;
  date: Date;
  prescriptionID: string;
  sx: string;
  vitals: Vitals;
  dx: Diagnosis[];
  labTest: string[];
  rx: PrescribedMedication[];
  advice: string[];
  originatedFromEmr: boolean;
  followUpSchedule: string;
  consultationMode: "on site" | "online";
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  images?: { url: string; remark: string }[];
}

const VitalsSchema = new Schema<Vitals>({
  BP: String,
  PR: String,
  SpO2: String,
});

const PrescribedMedicationSchema = new Schema<PrescribedMedication>({
  drugName: String,
  freequency: String,
  duration: String,
  quantity: String,
});

const dxSchema = new Schema<Diagnosis>({
  diagnosisName: String,
  dateOfDiagnosis: Date,
});

const ePrescriptionSchema = new Schema<EPrescriptionDocument>(
  {
    link: { type: String },
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [false, "user is required !"],
    },
    clinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: [false, "Clinic is required !"],
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [false, "user is required !"],
    },
    date: Date,
    prescriptionID: String,
    sx: String,
    vitals: VitalsSchema,
    dx: [dxSchema],
    labTest: [String],
    rx: [PrescribedMedicationSchema],
    advice: [String],
    originatedFromEmr: {
      type: Boolean,
      default: true,
    },
    followUpSchedule: { type: String },
    consultationMode: {
      type: String,
      enum: ["on site", "online"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    images: [{
      url: { type: String },
      remark: { type: String }
    }],
  },
  { timestamps: true }
);

export const EPrescription = model<EPrescriptionDocument>("Eprescription", ePrescriptionSchema);
