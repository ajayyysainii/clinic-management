import mongoose, { Schema, Document, Types } from 'mongoose';

// Define enums for better type safety
enum AddedBy {
  INDIVIDUAL_USER = 'IndividualUser',
  DOCTOR = 'Doctor',
}

enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

enum DepressionLevel {
  MINIMAL = 'Minimal',
  MILD = 'Mild',
  MODERATE = 'Moderate',
  MODERATELY_SEVERE = 'Moderately Severe',
  SEVERE = 'Severe',
}

// PHQ-9 Questions interface
interface PhqQuestions {
  littleInterest?: number; // Little interest or pleasure in doing things
  feelingDown?: number; // Feeling down, depressed, or hopeless
  sleepIssues?: number; // Trouble falling/staying asleep, or sleeping too much
  feelingTired?: number; // Feeling tired or having little energy
  appetiteIssues?: number; // Poor appetite or overeating
  feelingBad?: number; // Feeling bad about yourself or that you're a failure
  concentrationIssues?: number; // Trouble concentrating on things
  movingSpeaking?: number; // Moving or speaking slowly/being fidgety or restless
  suicidalThoughts?: number; // Thoughts that you would be better off dead
}

// Additional factors interface
interface AdditionalFactors {
  chronicConditions?: string[];
  medicationUse?: string[];
  pastTreatment?: string;
  sleepHours?: number;
}

// Main document interface
interface IDepressionRiskCalculator extends Document {
  user: Types.ObjectId;
  addedBy?: AddedBy;
  age: number;
  gender: Gender;
  phqQuestions?: PhqQuestions;
  phqScore: number;
  depressionLevel: DepressionLevel;
  additionalFactors?: AdditionalFactors;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const DepressionRiskCalculatorSchema: Schema<IDepressionRiskCalculator> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    addedBy: {
      type: String,
      enum: Object.values(AddedBy),
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
    // PHQ-9 Questions (Depression Scale)
    phqQuestions: {
      // Each question is scored 0-3
      // Over the last 2 weeks, how often have you been bothered by:
      littleInterest: { type: Number, min: 0, max: 3 }, // Little interest or pleasure in doing things
      feelingDown: { type: Number, min: 0, max: 3 }, // Feeling down, depressed, or hopeless
      sleepIssues: { type: Number, min: 0, max: 3 }, // Trouble falling/staying asleep, or sleeping too much
      feelingTired: { type: Number, min: 0, max: 3 }, // Feeling tired or having little energy
      appetiteIssues: { type: Number, min: 0, max: 3 }, // Poor appetite or overeating
      feelingBad: { type: Number, min: 0, max: 3 }, // Feeling bad about yourself or that you're a failure
      concentrationIssues: { type: Number, min: 0, max: 3 }, // Trouble concentrating on things
      movingSpeaking: { type: Number, min: 0, max: 3 }, // Moving or speaking slowly/being fidgety or restless
      suicidalThoughts: { type: Number, min: 0, max: 3 }, // Thoughts that you would be better off dead
    },
    // Total score from the PHQ-9 (0-27)
    phqScore: {
      type: Number,
      required: [true, "depression score is required !"],
    },
    // Depression level categorization based on PHQ-9 score
    depressionLevel: {
      type: String,
      enum: Object.values(DepressionLevel),
      required: [true, "depression level is required !"],
    },
    // Additional factors that may influence recommendations
    additionalFactors: {
      chronicConditions: [String],
      medicationUse: [String],
      pastTreatment: { type: String },
      sleepHours: { type: Number },
    },
  },
  { timestamps: true }
);

// Create and export the model
const DepressionRiskCalculator = mongoose.model<IDepressionRiskCalculator>(
  "DepressionRiskCalculator",
  DepressionRiskCalculatorSchema
);

export default DepressionRiskCalculator;
export {
  IDepressionRiskCalculator,
  PhqQuestions,
  AdditionalFactors,
  AddedBy,
  Gender,
  DepressionLevel,
};
