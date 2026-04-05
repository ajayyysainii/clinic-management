import mongoose, { Schema, Document, Types } from 'mongoose';

// Define enums for better type safety
enum AddedBy {
  INDIVIDUAL_USER = 'IndividualUser',
  DOCTOR = 'Doctor',
  EMPLOYEE = 'Employee',
}

enum QuestionKey {
  INTEREST_PLEASURE = 'interestPleasure',
  DOWN_DEPRESSED_HOPELESS = 'downDepressedHopeless',
  SLEEP_ISSUES = 'sleepIssues',
  TIRED_LOW_ENERGY = 'tiredLowEnergy',
  APPETITE_ISSUES = 'appetiteIssues',
  FEELING_BAD_FAILURE = 'feelingBadFailure',
  CONCENTRATION_ISSUES = 'concentrationIssues',
  MOVEMENT_ISSUES = 'movementIssues',
  SELF_HARM_THOUGHTS = 'selfHarmThoughts',
}

enum DepressionLevel {
  MINIMAL = 'Minimal',
  MILD = 'Mild',
  MODERATE = 'Moderate',
  MODERATELY_SEVERE = 'ModeratelySevere',
  SEVERE = 'Severe',
}

// Define interfaces
interface Question {
  questionKey: QuestionKey;
  score: number;
}

interface IPatientDepression extends Document {
  patientId: Types.ObjectId;
  addedBy?: AddedBy;
  questions: Question[];
  totalScore: number;
  depressionLevel: DepressionLevel;
  recommendation: string;
  selfHarmRisk: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const patientDepressionSchema: Schema<IPatientDepression> = new Schema(
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
          min: [0, 'Score must be at least 0'],
          max: [3, 'Score must be at most 3'],
        },
      },
    ],
    totalScore: {
      type: Number,
      required: [true, 'Total score is required'],
      min: [0, 'Total score must be at least 0'],
      max: [27, 'Total score must be at most 27'],
    },
    depressionLevel: {
      type: String,
      enum: Object.values(DepressionLevel),
      required: [true, 'Depression level is required'],
    },
    recommendation: {
      type: String,
      required: [true, 'Recommendation is required'],
      trim: true,
      minLength: [10, 'Recommendation must be at least 10 characters'],
      maxLength: [1000, 'Recommendation cannot exceed 1000 characters'],
    },
    selfHarmRisk: {
      type: Boolean,
      required: [true, 'Self harm risk assessment is required'],
    },
  },
  { timestamps: true }
);

// Create and export the model
const PatientDepression = mongoose.model<IPatientDepression>(
  "PatientDepression",
  patientDepressionSchema
);

export default PatientDepression;
export {
  IPatientDepression,
  Question,
  AddedBy,
  QuestionKey,
  DepressionLevel,
};
