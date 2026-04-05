import mongoose, { Schema, Document, Types } from 'mongoose';

// Define enums for better type safety
enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

enum StressLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
}

enum SleepQuality {
  POOR = 'Poor',
  FAIR = 'Fair',
  GOOD = 'Good',
}

enum WorkLifeBalance {
  POOR = 'Poor',
  FAIR = 'Fair',
  GOOD = 'Good',
}

// Define interfaces
interface PssQuestions {
  upsetByUnexpected?: number;
  unableToControl?: number;
  feltNervous?: number;
  confidentHandling?: number;
  thingsGoingWell?: number;
  couldNotCope?: number;
  controlIrritations?: number;
  onTopOfThings?: number;
  angryOutOfControl?: number;
  difficulties?: number;
}

interface AdditionalFactors {
  chronicConditions?: string[];
  sleepQuality?: SleepQuality;
  workLifeBalance?: WorkLifeBalance;
}

// Main document interface
interface IStressRiskCalculator extends Document {
  user: Types.ObjectId;
  age: number;
  gender: Gender;
  pssQuestions?: PssQuestions;
  pssScore: number;
  stressLevel: StressLevel;
  additionalFactors?: AdditionalFactors;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const StressRiskCalculatorSchema: Schema<IStressRiskCalculator> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    age: {
      type: Number,
      required: [true, "age is required !"],
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: [true, "gender is required !"],
    },
    // PSS Questions (Perceived Stress Scale)
    pssQuestions: {
      // Each question is scored 0-4
      // In the last month, how often have you:
      upsetByUnexpected: { type: Number, min: 0, max: 4 },
      unableToControl: { type: Number, min: 0, max: 4 },
      feltNervous: { type: Number, min: 0, max: 4 },
      confidentHandling: { type: Number, min: 0, max: 4 },
      thingsGoingWell: { type: Number, min: 0, max: 4 },
      couldNotCope: { type: Number, min: 0, max: 4 },
      controlIrritations: { type: Number, min: 0, max: 4 },
      onTopOfThings: { type: Number, min: 0, max: 4 },
      angryOutOfControl: { type: Number, min: 0, max: 4 },
      difficulties: { type: Number, min: 0, max: 4 },
    },
    // Total score from the PSS (0-40)
    pssScore: {
      type: Number,
      required: [true, "stress score is required !"],
    },
    // Stress level categorization (Low, Moderate, High)
    stressLevel: {
      type: String,
      enum: Object.values(StressLevel),
      required: [true, "stress level is required !"],
    },
    // Additional factors that may influence stress recommendations
    additionalFactors: {
      chronicConditions: [String],
      sleepQuality: { type: String, enum: Object.values(SleepQuality) },
      workLifeBalance: { type: String, enum: Object.values(WorkLifeBalance) },
    },
  },
  { timestamps: true }
);

// Create and export the model
const StressRiskCalculator = mongoose.model<IStressRiskCalculator>(
  "StressRiskCalculator",
  StressRiskCalculatorSchema
);

export default StressRiskCalculator;
export {
  IStressRiskCalculator,
  PssQuestions,
  AdditionalFactors,
  Gender,
  StressLevel,
  SleepQuality,
  WorkLifeBalance,
};
