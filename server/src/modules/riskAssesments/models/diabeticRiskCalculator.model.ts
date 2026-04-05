import mongoose, { Schema, Document, Types } from 'mongoose';

// Define enums and types for better type safety
enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
  VERY_HIGH = 'Very High',
}

// Main document interface
interface IDiabeticRiskCalculator extends Document {
  user: Types.ObjectId;
  ageScore: number;
  waistScore: number;
  physicalActivityScore: number;
  familyHistoryScore: number;
  totalScore: number;
  riskLevel: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const DiabeticRiskCalculatorSchema: Schema<IDiabeticRiskCalculator> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    ageScore: {
      type: Number,
      default: 0,
    },
    waistScore: {
      type: Number,
      default: 0,
    },
    physicalActivityScore: {
      type: Number,
      default: 0,
    },
    familyHistoryScore: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      trim: true,
      required: [true, "risk level is required !"],
    },
  },
  { timestamps: true }
);

// Create and export the model
const DiabeticRiskCalculator = mongoose.model<IDiabeticRiskCalculator>(
  "DiabeticRiskCalculator",
  DiabeticRiskCalculatorSchema
);

export default DiabeticRiskCalculator;
export {
  IDiabeticRiskCalculator,
  RiskLevel,
};
