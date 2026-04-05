import mongoose, { Schema, Document, Types } from 'mongoose';

// Define enums for better type safety
enum RiskLevel {
  HIGHER = 'higher',
  LOWER = 'lower',
}

// Define interfaces
interface IStrokeRiskCalculator extends Document {
  user: Types.ObjectId;
  bloodPressure?: RiskLevel;
  atrialFibrillation?: RiskLevel;
  bloodSugar?: RiskLevel;
  bmi?: RiskLevel;
  diet?: RiskLevel;
  cholesterol?: RiskLevel;
  diabetes?: RiskLevel;
  physicalActivity?: RiskLevel;
  history?: RiskLevel;
  tobacco?: RiskLevel;
  lowerRiskScore: number;
  higherRiskScore: number;
  desc?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const StrokeRiskCalculatorSchema: Schema<IStrokeRiskCalculator> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    bloodPressure: {
      type: String,
      enum: Object.values(RiskLevel),
    },
    atrialFibrillation: {
      type: String,
      enum: Object.values(RiskLevel),
    },
    bloodSugar: {
      type: String,
      enum: Object.values(RiskLevel),
    },
    bmi: {
      type: String,
      enum: Object.values(RiskLevel),
    },
    diet: {
      type: String,
      enum: Object.values(RiskLevel),
    },
    cholesterol: {
      type: String,
      enum: Object.values(RiskLevel),
    },
    diabetes: {
      type: String,
      enum: Object.values(RiskLevel),
    },
    physicalActivity: {
      type: String,
      enum: Object.values(RiskLevel),
    },
    history: {
      type: String,
      enum: Object.values(RiskLevel),
    },
    tobacco: {
      type: String,
      enum: Object.values(RiskLevel),
    },
    lowerRiskScore: {
      type: Number,
      default: 0,
    },
    higherRiskScore: {
      type: Number,
      default: 0,
    },
    desc: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create and export the model
const StrokeRiskCalculator = mongoose.model<IStrokeRiskCalculator>(
  "StrokeRiskCalculator",
  StrokeRiskCalculatorSchema
);

export default StrokeRiskCalculator;
export {
  IStrokeRiskCalculator,
  RiskLevel,
};
