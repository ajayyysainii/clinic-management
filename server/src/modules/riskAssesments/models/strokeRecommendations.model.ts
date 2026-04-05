import mongoose, { Schema, Document } from 'mongoose';

// Define enums for better type safety
enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
}

// Main document interface
interface IStrokeRecommendations extends Document {
  riskLevel: RiskLevel;
  dietRecommendation: string;
  medicalRecommendation: string;
  physicalActivityRecommendation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const StrokeRecommendationsSchema: Schema<IStrokeRecommendations> = new Schema(
  {
    riskLevel: {
      type: String,
      required: [true, "Risk level is required"],
      enum: Object.values(RiskLevel),
    },
    dietRecommendation: {
      type: String,
      required: [true, "Diet recommendation is required"],
    },
    medicalRecommendation: {
      type: String,
      required: [true, "Medical recommendation is required"],
    },
    physicalActivityRecommendation: {
      type: String,
      required: [true, "Physical activity recommendation is required"],
    },
  },
  { timestamps: true }
);

// Index for quick lookup
StrokeRecommendationsSchema.index({ riskLevel: 1 });

// Create and export the model
const StrokeRecommendations = mongoose.model<IStrokeRecommendations>(
  "StrokeRecommendations",
  StrokeRecommendationsSchema
);

export default StrokeRecommendations;
export {
  IStrokeRecommendations,
  RiskLevel,
};
