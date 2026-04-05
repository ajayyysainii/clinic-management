import mongoose, { Schema, Document } from 'mongoose';

// Define enums for better type safety
enum DepressionLevel {
  MINIMAL = 'Minimal',
  MILD = 'Mild',
  MODERATE = 'Moderate',
  MODERATELY_SEVERE = 'Moderately Severe',
  SEVERE = 'Severe',
}

enum AgeGroup {
  YOUNG_ADULT = '18-40',
  MIDDLE_AGED = '41-60',
  SENIOR = '60+',
  ALL_AGES = 'All Ages',
}

enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  ALL_GENDERS = 'All Genders',
}

// Main document interface
interface IDepressionRecommendations extends Document {
  depressionLevel: DepressionLevel;
  ageGroup: AgeGroup;
  gender: Gender;
  dietaryRecommendation: string;
  activityRecommendation: string;
  supportRecommendation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const DepressionRecommendationsSchema: Schema<IDepressionRecommendations> = new Schema(
  {
    depressionLevel: {
      type: String,
      enum: Object.values(DepressionLevel),
      required: [true, "depression level is required !"],
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
      trim: true,
      minLength: [10, 'Dietary recommendation must be at least 10 characters'],
      maxLength: [1000, 'Dietary recommendation cannot exceed 1000 characters'],
    },
    activityRecommendation: {
      type: String,
      required: [true, "activity recommendation is required !"],
      trim: true,
      minLength: [10, 'Activity recommendation must be at least 10 characters'],
      maxLength: [1000, 'Activity recommendation cannot exceed 1000 characters'],
    },
    supportRecommendation: {
      type: String,
      required: [true, "support recommendation is required !"],
      trim: true,
      minLength: [10, 'Support recommendation must be at least 10 characters'],
      maxLength: [1000, 'Support recommendation cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

// Create and export the model
const DepressionRecommendations = mongoose.model<IDepressionRecommendations>(
  "DepressionRecommendations",
  DepressionRecommendationsSchema
);

export default DepressionRecommendations;
export {
  IDepressionRecommendations,
  DepressionLevel,
  AgeGroup,
  Gender,
};
