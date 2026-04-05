import mongoose, { Schema, Document } from "mongoose";

// Interface for the document
export interface ICoronaryRecommendations extends Document {
  ageGroup: "18-30" | "31-45" | "46-60" | "61+";
  gender: "Male" | "Female";
  riskLevel: "Low" | "Moderate" | "High" | "Very High";
  dietAdjustments: string;
  physicalActivity: string;
  medicalInterventions: string;
  createdAt: Date;
  updatedAt: Date;
}

const CoronaryRecommendationsSchema: Schema<ICoronaryRecommendations> = new Schema(
  {
    ageGroup: {
      type: String,
      required: [true, "Age group is required"],
      enum: ["18-30", "31-45", "46-60", "61+"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female"],
    },
    riskLevel: {
      type: String,
      required: [true, "Risk level is required"],
      enum: ["Low", "Moderate", "High", "Very High"],
    },
    dietAdjustments: {
      type: String,
      required: [true, "Diet adjustments are required"],
    },
    physicalActivity: {
      type: String,
      required: [true, "Physical activity recommendations are required"],
    },
    medicalInterventions: {
      type: String,
      required: [true, "Medical intervention recommendations are required"],
    },
  },
  { timestamps: true }
);

// Compound index for quick lookup
CoronaryRecommendationsSchema.index({ ageGroup: 1, gender: 1, riskLevel: 1 });

export default mongoose.model<ICoronaryRecommendations>(
  "CoronaryRecommendations",
  CoronaryRecommendationsSchema
);
