// controllers/patient/riskAssessments/liverRiskCalculator.controller.ts

import { Request, Response } from 'express';
import AppConstant from '../../../utils/AppConstants';
import ResponseU from '../../../utils/Response';
import liverRecommendationsModel from '../models/liverRecommendations.model';
import liverRiskCalculateModel from '../models/liverRiskCalculate.model';
import { determineLiverRiskLevel } from '../../../utils/riskAssesments/liverRiskUtils';
import { calculateLiverRiskHelper, type RiskFactors } from '../helpers/calculateLiverRisk'
import { liverRiskCalculatorValidationSchema } from '../validation/liverRiskCalculator.validator'

// Define types for better type safety
type AgeRange = "Under 40" | "41-60" | "Over 60";
type ExerciseLevel = "Never" | "Less than 1 Hour per Week" | "1-2 Hours per Week" | "3-4 Hours per Week" | "Over 5 Hours per Week";
type AlcoholFrequency = "Never" | "Monthly or Less" | "2-4 Times per Month" | "2-3 Times per Week" | "Over 4 Times per Week";
type RiskLevel = "LOW" | "MODERATE" | "HIGH";

// Define interfaces for type safety
interface DietaryHabits {
  regularMeals: boolean;
  frequentSnacks: boolean;
  processedFoods: boolean;
  sodaJuices: boolean;
  restaurantFood: boolean;
}

interface LiverRiskRequestBody {
  age: number | string;
  gender: "Male" | "Female" | "Prefer not to say";
  riskReasons: string[];
  diabetes: "Yes" | "No";
  highBloodPressure: "Yes" | "No";
  exercise: string;
  alcohol: string;
  dietaryHabits: DietaryHabits;
  user: string;
}

interface GetAllLiverRiskRequestBody {
  patientId: string;
}

interface LiverRiskAssessment {
  _id: string;
  riskScore: number;
  riskLevel: string;
  createdAt: Date;
}

interface LiverRecommendation {
  dietRecommendation: string;
  medicalRecommendation: string;
  physicalActivityRecommendation: string;
}

interface AssessmentWithRecommendations {
  _id: string;
  riskScore: number;
  riskLevel: string;
  recommendations: LiverRecommendation | null;
  createdAt: Date;
}

interface LiverRiskDocument {
  _id: string;
  user: string;
  age: AgeRange;
  gender: string;
  riskReasons: string[];
  diabetes: "Yes" | "No";
  highBloodPressure: "Yes" | "No";
  exercise: ExerciseLevel;
  alcohol: AlcoholFrequency;
  dietaryHabits: DietaryHabits;
  riskScore: number;
  riskLevel: RiskLevel;
  createdAt: Date;
  updatedAt: Date;
}

// Fallback utility function in case import fails
const fallbackDetermineLiverRiskLevel = (riskScore: number): string => {
  if (riskScore <= 5) {
    return "Low";
  } else if (riskScore >= 6 && riskScore <= 12) {
    return "Moderate";
  } else {
    return "High"; // riskScore >= 13
  }
};

// Helper function to format age
const getFormattedAge = (age: number | string): AgeRange => {
  const parsedAge: number = typeof age === "string" ? parseInt(age, 10) : age;

  if (isNaN(parsedAge)) {
    throw new Error("Invalid age value");
  }

  if (parsedAge <= 40) {
    return "Under 40";
  } else if (parsedAge <= 60) {
    return "41-60";
  } else {
    return "Over 60";
  }
};

// Helper function to validate and normalize exercise value
const normalizeExerciseValue = (exercise: string): ExerciseLevel => {
  const allowedExerciseValues: ExerciseLevel[] = [
    "Never",
    "Less than 1 Hour per Week",
    "1-2 Hours per Week",
    "3-4 Hours per Week",
    "Over 5 Hours per Week"
  ];

  const found = allowedExerciseValues.find(value => value === exercise);
  return found || "Never";
};

// Helper function to validate and normalize alcohol value
const normalizeAlcoholValue = (alcohol: string): AlcoholFrequency => {
  const allowedAlcoholValues: AlcoholFrequency[] = [
    "Never",
    "Monthly or Less",
    "2-4 Times per Month",
    "2-3 Times per Week",
    "Over 4 Times per Week"
  ];

  const found = allowedAlcoholValues.find(value => value === alcohol);
  return found || "Never";
};

// Create liver risk calculator
const createLiverRiskCalculator = async (req: Request,res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = liverRiskCalculatorValidationSchema.validate(req.body);
    if (error) {
      ResponseU.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation error!"
      );
      return;
    }

    const validatedData = value as LiverRiskRequestBody;

    // Format and normalize data
    const formattedAge = getFormattedAge(validatedData.age);
    const normalizedExercise = normalizeExerciseValue(validatedData.exercise);
    const normalizedAlcohol = normalizeAlcoholValue(validatedData.alcohol);

    // Prepare risk factors for calculation
    const riskFactors: RiskFactors = {
      age: formattedAge,
      riskReasons: validatedData.riskReasons,
      diabetes: validatedData.diabetes,
      highBloodPressure: validatedData.highBloodPressure,
      exercise: normalizedExercise,
      alcohol: normalizedAlcohol,
      dietaryHabits: validatedData.dietaryHabits,
    };

    // Calculate risk score and level
    const { riskScore, riskLevel } = calculateLiverRiskHelper(riskFactors);

    // Create new liver risk assessment
    const newLiverRisk = new liverRiskCalculateModel({
      ...validatedData,
      age: formattedAge,
      exercise: normalizedExercise,
      alcohol: normalizedAlcohol,
      riskScore,
      riskLevel,
    });

    const savedLiverRisk = await newLiverRisk.save();

    ResponseU.success(
      res,
      savedLiverRisk,
      201,
      "Liver risk calculated successfully!",
      AppConstant.SUCCESS
    );
    return
  } catch (err: any) {
    console.error("Error in createLiverRiskCalculator:", err);

    if (err.name === "ValidationError") {
      const errorMessages: string[] = Object.values(err.errors).map(
        (error: any) => error.message
      );
      ResponseU.error(
        res,
        400,
        AppConstant.FAILED,
        errorMessages.join(", ") || "Validation error!"
      );
      return
    }

    if (err.message === "Invalid age value") {
      ResponseU.error(
        res,
        400,
        AppConstant.FAILED,
        "Please provide a valid age value"
      );
      return
    }

    ResponseU.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
    return;
  }
};

// Get all liver risk assessments with recommendations
const getAllLiverRiskCalculator = async (req: Request,res: Response): Promise<void> => {
  try {
    const { patientId } = req.body;

    if (!patientId || typeof patientId !== 'string') {
      ResponseU.error(
        res,
        400,
        AppConstant.FAILED,
        "Valid Patient ID is required"
      );
      return
    }

    // Get all assessments sorted by date
    const allAssessments = (
      await liverRiskCalculateModel
        .find(
          { user: patientId },
          "riskScore riskLevel createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .exec()
    ).map((assessment: any) => ({
      ...assessment,
      _id: assessment._id.toString(),
    })) as LiverRiskAssessment[];

    // If there are no assessments, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      ResponseU.success(
        res,
        [],
        200,
        "No liver risk assessments found for this user",
        AppConstant.SUCCESS
      );
      return
    }

    // Process each assessment to include recommendations
    const assessmentsWithRecommendations: AssessmentWithRecommendations[] = await Promise.all(
      allAssessments.map(async (assessment: LiverRiskAssessment): Promise<AssessmentWithRecommendations> => {
        try {
          const riskScore: number = assessment.riskScore || 0;

          // Use imported function with fallback for risk level
          const getRiskLevel: (score: number) => string =
            typeof determineLiverRiskLevel === "function"
              ? determineLiverRiskLevel
              : fallbackDetermineLiverRiskLevel;

          // Normalize risk level format from DB (HIGH/MODERATE/LOW) to Title case (High/Moderate/Low)
          const normalizedRiskLevel: string =
            assessment.riskLevel.charAt(0).toUpperCase() +
            assessment.riskLevel.slice(1).toLowerCase();

          // Fetch recommendations for this assessment
          const recommendationData = await liverRecommendationsModel
            .findOne({
              riskLevel: normalizedRiskLevel,
            })
            .lean()
            .exec();

          // If recommendation found, include it with the assessment
          let recommendations: LiverRecommendation | null = null;

          if (recommendationData) {
            recommendations = {
              dietRecommendation: recommendationData.dietRecommendation || "",
              medicalRecommendation: recommendationData.medicalRecommendation || "",
              physicalActivityRecommendation: recommendationData.physicalActivityRecommendation || "",
            };
          }

          // Return assessment with embedded recommendations
          return {
            _id: assessment._id,
            riskScore: assessment.riskScore,
            riskLevel: normalizedRiskLevel,
            recommendations,
            createdAt: assessment.createdAt,
          };
        } catch (assessmentError: any) {
          console.error(`Error processing assessment ${assessment._id}:`, assessmentError);
          // Return assessment without recommendations if there's an error
          return {
            _id: assessment._id,
            riskScore: assessment.riskScore,
            riskLevel: assessment.riskLevel,
            recommendations: null,
            createdAt: assessment.createdAt,
          };
        }
      })
    );

    ResponseU.success(
      res,
      assessmentsWithRecommendations,
      200,
      "Liver risk assessments and recommendations found successfully",
      AppConstant.SUCCESS
    );
    return
  } catch (err: any) {
    console.error("Error fetching liver risk data:", err);
    ResponseU.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
    return;
  }
};

export {
  createLiverRiskCalculator,
  getAllLiverRiskCalculator,
  type LiverRiskRequestBody,
  type GetAllLiverRiskRequestBody,
  type LiverRiskAssessment,
  type AssessmentWithRecommendations,
};
