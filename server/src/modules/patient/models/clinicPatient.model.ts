import mongoose, { Document, Schema, Types } from 'mongoose'

// Enum for visit status
export enum triage {
  EMERGENCY = 'emergency',
  NORMAL = 'normal',
  FOLLOW_UP = 'follow-up',
}

export enum Relationship {
  SELF = 'self',
  MOTHER = 'mother',
  FATHER = 'father',
  BROTHER = 'brother',
  SISTER = 'sister',
  SPOUSE = 'spouse',
  CHILD = 'child',
  OTHER = 'other',
}


// Interface for the document
export interface IClinicPatient extends Document {
  clinicId: Types.ObjectId
  userId: Types.ObjectId
  DOB: Date
  triage: triage
  visitDates: Date[]
  assignedDoctors: string[] // New field for assigned doctors
  bloodPressure?: string
  weight?: number
  height?: number
  notes?: string
  relationship: Relationship
  familyMemberName?: string
  // New health vitals fields
  heartRate?: number
  temperature?: number
  hba1c?: number
  bloodGlucose?: number
  spO2?: number
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Schema definition
const clinicPatient = new Schema<IClinicPatient>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    DOB: {
      type: Date,
    },
    triage: {
      type: String,
      enum: Object.values(triage),
    },
    visitDates: [
      {
        type: Date,
      },
    ],
    assignedDoctors: [
      {
        // New field for assigned doctors
        type: String,
      },
    ],
    bloodPressure: {
      type: String,
    },
    weight: {
      type: Number,
    },
    height: {
      type: Number,
    },
    // New health vitals fields
    heartRate: {
      type: Number,
      min: 0,
    },
    temperature: {
      type: Number,
      min: 0,
    },
    hba1c: {
      type: Number,
      min: 0,
    },
    bloodGlucose: {
      type: Number,
      min: 0,
    },
    spO2: {
      type: Number,
      min: 0,
      max: 100,
    },
    relationship: {
      type: String,
      enum: Object.values(Relationship),
      required: true,
      default: Relationship.SELF,
    },
    familyMemberName: {
      type: String,
      validate: {
        validator: function (this: IClinicPatient, v: string) {
          return this.relationship === Relationship.SELF || v
        },
        message: 'Family member name is required for non-self relationships',
      },
    },
    deletedAt: { type: Date, default: null },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

export const ClinicPatient = mongoose.model<IClinicPatient>('clinicPatient', clinicPatient)


