import mongoose, { Schema, Document, Types } from 'mongoose';

// Define enums for better type safety
enum AddedBy {
  INDIVIDUAL_USER = 'IndividualUser',
  DOCTOR = 'Doctor',
  EMPLOYEE = 'Employee',
}

enum QuestionKey {
  UNEXPECTED_EVENTS = 'unexpectedEvents',
  CONTROL_IMPORTANT_THINGS = 'controlImportantThings',
  NERVOUS_STRESSED = 'nervousStressed',
  HANDLE_PROBLEMS = 'handleProblems',
  GOING_YOUR_WAY = 'goingYourWay',
  COPE_WITH_THINGS = 'copeWithThings',
  CONTROL_IRRITATIONS = 'controlIrritations',
  ON_TOP_OF_THINGS = 'onTopOfThings',
  OUTSIDE_CONTROL = 'outsideControl',
  DIFFICULTIES_PILING_UP = 'difficultiesPilingUp',
}

enum StressLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
}

// Define interfaces
interface Question {
  questionKey: QuestionKey;
  score: number;
}

interface IPatientStress extends Document {
  patientId: Types.ObjectId;
  addedBy?: AddedBy;
  questions: Question[];
  totalScore: number;
  stressLevel: StressLevel;
  recommendation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const patientStressSchema: Schema<IPatientStress> = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    addedBy: {
      type: String,
      enum: Object.values(AddedBy),
      // required: [true, "addedBy is required !"],
    },
    questions: [
      {
        questionKey: {
          type: String,
          required: true,
          enum: Object.values(QuestionKey),
        },
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 4,
        },
      },
    ],
    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 40,
    },
    stressLevel: {
      type: String,
      enum: Object.values(StressLevel),
      required: true,
    },
    recommendation: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Create and export the model
const PatientStress = mongoose.model<IPatientStress>(
  "PatientStress",
  patientStressSchema
);

export default PatientStress;
export {
  IPatientStress,
  Question,
  AddedBy,
  QuestionKey,
  StressLevel,
};
