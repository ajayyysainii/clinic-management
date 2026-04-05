import mongoose, { Schema, Document } from 'mongoose';

// Define enums for better type safety
enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
}

enum AgeGroup {
  YOUNG_ADULT = '18-40',
  MIDDLE_AGED = '41-60',
  SENIOR = '60+',
}

enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

// Main document interface
interface IStressRecommendations extends Document {
  riskLevel: RiskLevel;
  ageGroup: AgeGroup;
  gender: Gender;
  dietaryRecommendation: string;
  physicalActivityRecommendation: string;
  mentalSupportRecommendation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const StressRecommendationsSchema: Schema<IStressRecommendations> = new Schema(
  {
    riskLevel: {
      type: String,
      enum: Object.values(RiskLevel),
      required: [true, "risk level is required !"],
    },
    ageGroup: {
      type: String,
      enum: Object.values(AgeGroup),
      required: [true, "age group is required !"],
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: [true, "gender is required !"],
    },
    dietaryRecommendation: {
      type: String,
      required: [true, "dietary recommendation is required !"],
    },
    physicalActivityRecommendation: {
      type: String,
      required: [true, "physical activity recommendation is required !"],
    },
    mentalSupportRecommendation: {
      type: String,
      required: [true, "mental/medical support recommendation is required !"],
    },
  },
  { timestamps: true }
);

// Create and export the model
const StressRecommendations = mongoose.model<IStressRecommendations>(
  "StressRecommendations",
  StressRecommendationsSchema
);

export default StressRecommendations;
export {
  IStressRecommendations,
  RiskLevel,
  AgeGroup,
  Gender,
};
