import mongoose, { Schema, Document } from 'mongoose';

// Define enums for better type safety
enum AgeGroup {
  YOUNG = '20-39',
  MIDDLE = '40-59',
  SENIOR = '60+',
}

enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  ALL = 'All',
}

enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
}

// Main document interface
interface IDiabeticRecommendations extends Document {
  ageGroup: AgeGroup;
  gender: Gender;
  riskLevel: RiskLevel;
  dietaryRecommendation: string;
  medicalRecommendation: string;
  physicalActivityRecommendation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const DiabeticRecommendationsSchema: Schema<IDiabeticRecommendations> = new Schema(
  {
    ageGroup: {
      type: String,
      required: [true, "Age group is required"],
      enum: Object.values(AgeGroup),
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: Object.values(Gender),
    },
    riskLevel: {
      type: String,
      required: [true, "Risk level is required"],
      enum: Object.values(RiskLevel),
    },
    dietaryRecommendation: {
      type: String,
      required: [true, "Dietary recommendation is required"],
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

// Compound index for quick lookup
DiabeticRecommendationsSchema.index({ ageGroup: 1, gender: 1, riskLevel: 1 });

// Create and export the model
const DiabeticRecommendations = mongoose.model<IDiabeticRecommendations>(
  "DiabeticRecommendations",
  DiabeticRecommendationsSchema
);

export default DiabeticRecommendations;
export {
  IDiabeticRecommendations,
  AgeGroup,
  Gender,
  RiskLevel,
};
