import mongoose, { Schema, Document } from "mongoose";

// Enum for risk levels
enum RiskLevel {
  LOW = "Low",
  MODERATE = "Moderate",
  HIGH = "High"
}

// Interface for LiverRecommendations document
interface ILiverRecommendations extends Document {
  riskLevel: RiskLevel;
  dietRecommendation: string;
  medicalRecommendation: string;
  physicalActivityRecommendation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const LiverRecommendationsSchema = new Schema<ILiverRecommendations>(
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
LiverRecommendationsSchema.index({ riskLevel: 1 });

// Export the interface, enum, and model
export { ILiverRecommendations, RiskLevel };
export default mongoose.model<ILiverRecommendations>(
  "LiverRecommendations",
  LiverRecommendationsSchema
);
