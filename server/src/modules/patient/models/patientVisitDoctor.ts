import mongoose, { Document, Schema, Types } from 'mongoose'

export enum ConsultationMode {
  ONSITE = 'onsite',
  TELE_CONSULTATION = 'tele-consultation',
  HOME_VISIT = 'home-visit',
}

export enum Status {
  FOLLOW_UP = 'Follow Up',
  COMPLETED = 'Completed',
  PENDING = 'Pending',
  CANCELLED = 'Cancelled',
}

interface TeleconsultationSession {
  channelName: string;
  doctorUid: number;
  patientUid?: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
}

export interface IPatientVisitDoctors extends Document {
  clinicPatientId: Types.ObjectId
  doctorId: Types.ObjectId
  appointmentTime: Date
  consultationMode: ConsultationMode
  status: Status
  diagnosis?: string
  prescriptionId?: Types.ObjectId
  teleconsultationSession?: TeleconsultationSession
  createdAt: Date
  updatedAt: Date
}

const PatientVisitDoctorsSchema = new Schema<IPatientVisitDoctors>(
  {
    clinicPatientId: {
      type: Schema.Types.ObjectId,
      ref: 'ClinicPatient',
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    appointmentTime: {
      type: Date,
    },
    consultationMode: {
      type: String,
      enum: Object.values(ConsultationMode),
    },
    status: {
      type: String,
      enum: Object.values(Status),
      default: Status.PENDING,
      required: false
    },
    diagnosis: {
      type: String,
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    teleconsultationSession: {
      channelName: String,
      doctorUid: Number,
      patientUid: Number,
      status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'cancelled'],
        default: 'pending',
      },
      startTime: Date,
      endTime: Date,
    },
  },
  {
    timestamps: true,
  },
)

export const PatientVisitDoctors = mongoose.model<IPatientVisitDoctors>(
  'PatientVisitDoctors',
  PatientVisitDoctorsSchema,
)
