import { Request, Response as ExpressResponse } from 'express';
import mongoose from 'mongoose';
import coronaryHeartDiseaseModel from '../models/coronaryHeartDisease.model';
import AppConstant from '../../../utils/AppConstants';
import Response from '../../../utils/Response';
import { coronaryHeartDiseaseValidationSchema } from '../validation/coronaryHeartDiseases.validator'
import { calculateRisk } from '../helpers/DiseaseAssessmentHelper.helper';
// import userModel from '../../../models/common/user.model';
import { User } from '../../user/models';
import { PatientVisitDoctors } from '../../patient/models';
import diabeticRiskCalculatorModel from '../models/diabeticRiskCalculator.model';
import diabeticRecommendationsModel from '../models/diabeticRecommendations.model';
import { diabeticRiskCalculatorValidation } from '../validation/daibeticRiskCalculator.validator';
import { calculateDiabeticRiskHelper } from '../helpers/diabeticRiskCalculator.helper'
import {
  determineDiabeticRiskLevel,
  determineDiabeticAgeGroup,
  mapGenderForDiabeticRecommendations,
} from '../../../utils/riskAssesments/diabeticRiskUtils'

// Define interfaces
interface CreateDiabeticRiskRequest {
  user: string;
  ageScore?: number;
  waistScore?: number;
  physicalActivityScore?: number;
  familyHistoryScore?: number;
  age?: number;
  waistCircumference?: number;
  physicalActivity?: string;
  familyHistory?: string;
  gender?: string;
}

interface GetAllDiabeticRiskRequest {
  patientId: string;
}

interface CustomRequest extends Request {
  body: CreateDiabeticRiskRequest | GetAllDiabeticRiskRequest;
}

interface DiabeticRiskResult {
  totalScore: number;
  riskLevel: string;
}

interface UserProfile {
  age: number;
  gender: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface RecommendationData {
  dietaryRecommendation: string;
  medicalRecommendation: string;
  physicalActivityRecommendation: string;
}

interface AssessmentWithRecommendation {
  _id: string;
  user: string;
  ageScore: number;
  waistScore: number;
  physicalActivityScore: number;
  familyHistoryScore: number;
  totalScore: number;
  riskLevel: string;
  createdAt: Date;
  updatedAt: Date;
  recommendation: RecommendationData;
}

interface ResponseData {
  userProfile?: UserProfile;
  assessments: AssessmentWithRecommendation[];
}

type RiskLevel = 'Low' | 'Moderate' | 'High';
type Gender = 'Male' | 'Female' | 'All';
type AgeGroup = '20-39' | '40-59' | '60+';

// Fallback utility functions in case import fails
const fallbackDetermineDiabeticRiskLevel = (totalScore: number): RiskLevel => {
  if (totalScore < 30) {
    return "Low";
  } else if (totalScore >= 30 && totalScore < 60) {
    return "Moderate";
  } else {
    return "High";
  }
};

// Function to extract standardized risk level from legacy format
const extractRiskLevelFromLegacy = (legacyRiskLevel: string): RiskLevel | null => {
  const legacyText = legacyRiskLevel.toLowerCase();
  if (legacyText.includes("high")) return "High";
  if (legacyText.includes("moderate")) return "Moderate";
  if (legacyText.includes("low")) return "Low";
  return null; // Default case
};

const fallbackDetermineDiabeticAgeGroup = (age: number): AgeGroup => {
  if (age < 40) {
    return "20-39";
  } else if (age >= 40 && age < 60) {
    return "40-59";
  } else {
    return "60+";
  }
};

const fallbackMapGenderForDiabeticRecommendations = (gender: string, ageGroup: AgeGroup): Gender => {
  if (ageGroup === "20-39" || ageGroup === "60+") {
    return "All";
  }

  if (gender === "M" || gender === "Male") {
    return "Male";
  } else if (gender === "F" || gender === "Female") {
    return "Female";
  }

  return "All";
};

// Helper function to calculate age score
const calculateAgeScore = (age: number): number => {
  if (age < 35) return 0;
  if (age >= 35 && age <= 49) return 20;
  return 30; // age >= 50
};

// Helper function to calculate waist score
const calculateWaistScore = (waistCircumference: number, gender: string): number => {
  if (gender.toLowerCase() === "female") {
    if (waistCircumference < 80) return 0;
    if (waistCircumference >= 80 && waistCircumference <= 89) return 10;
    return 20; // waistCircumference >= 90
  } else {
    if (waistCircumference < 90) return 0;
    if (waistCircumference >= 90 && waistCircumference <= 99) return 10;
    return 20; // waistCircumference >= 100
  }
};

// Helper function to calculate physical activity score
const calculatePhysicalActivityScore = (activityLevel: string): number => {
  const level = activityLevel.toLowerCase();
  if (level.includes("vigorous") || level.includes("strenuous")) return 0;
  if (level.includes("moderate")) return 10;
  if (level.includes("mild")) return 20;
  return 30; // sedentary or no exercise
};

// Helper function to calculate family history score
const calculateFamilyHistoryScore = (familyHistory: string): number => {
  const history = familyHistory.toLowerCase();
  if (history.includes("both")) return 20;
  if (history.includes("one")) return 10;
  return 0; // no diabetes in parents
};

const updateSampleRecommendation = async (): Promise<void> => {
  try {
    const allRecs = await diabeticRecommendationsModel.find({});

    // Only update if records are missing the physicalActivityRecommendation field
    for (const rec of allRecs) {
      if (!rec.physicalActivityRecommendation) {
        // Add default physical activity recommendation based on risk level
        let activityRec = "Regular moderate physical activity for 30 minutes daily.";

        if (rec.riskLevel === "High") {
          activityRec = "Light exercise as approved by your doctor.";
        } else if (rec.riskLevel === "Moderate") {
          activityRec = "Moderate exercise 3-4 times per week.";
        }

        rec.physicalActivityRecommendation = activityRec;
        await rec.save();
        console.log(
          `Updated recommendation ${rec._id} with missing physical activity recommendation`
        );
      }
    }
  } catch (err: any) {
    console.error("Error updating sample recommendation:", err);
  }
};

// Create diabetic risk calculator entry
const createDiabeticRiskCalculator = async (
  req: Request,
  res: ExpressResponse
): Promise<void> => {
  try {
    const { error } = diabeticRiskCalculatorValidation.validate(req.body);
    if (error) {
      Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation error !"
      );
      return
    }

    const requestBody = req.body as CreateDiabeticRiskRequest;
    let ageScore: number, waistScore: number, physicalActivityScore: number, familyHistoryScore: number;

    // Check if raw data is provided instead of scores
    if (
      requestBody.age &&
      requestBody.waistCircumference &&
      requestBody.physicalActivity &&
      requestBody.familyHistory
    ) {
      // Calculate scores from raw data
      ageScore = calculateAgeScore(requestBody.age);
      waistScore = calculateWaistScore(
        requestBody.waistCircumference,
        requestBody.gender || 'Male'
      );
      physicalActivityScore = calculatePhysicalActivityScore(
        requestBody.physicalActivity
      );
      familyHistoryScore = calculateFamilyHistoryScore(requestBody.familyHistory);
    } else {
      // Use provided scores directly
      ageScore = Number(requestBody.ageScore || 0);
      waistScore = Number(requestBody.waistScore || 0);
      physicalActivityScore = Number(requestBody.physicalActivityScore || 0);
      familyHistoryScore = Number(requestBody.familyHistoryScore || 0);
    }

    // Calculate risk using helper function
    const { totalScore, riskLevel }: DiabeticRiskResult = calculateDiabeticRiskHelper({
      ageScore,
      waistScore,
      physicalActivityScore,
      familyHistoryScore,
    });

    // Create new diabetic risk assessment
    const newDiabeticRisk = await diabeticRiskCalculatorModel.create({
      user: requestBody.user,
      ageScore,
      waistScore,
      physicalActivityScore,
      familyHistoryScore,
      totalScore,
      riskLevel,
      // Include raw data if it was provided
      ...(requestBody.age && {
        age: requestBody.age,
        waistCircumference: requestBody.waistCircumference,
        physicalActivity: requestBody.physicalActivity,
        familyHistory: requestBody.familyHistory,
        gender: requestBody.gender,
      }),
    });

    Response.success(
      res,
      newDiabeticRisk,
      201,
      "Diabetic risk assessment calculated successfully!",
      AppConstant.SUCCESS
    );
    return
  } catch (err: any) {
     Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
    return
  }
};

// Get all diabetic risk assessments
const getAllDiabeticRiskCalculatorDateAndRisk = async (
  req: Request,
  res: ExpressResponse
): Promise<void> => {
  try {
    const requestBody = req.body as GetAllDiabeticRiskRequest;
    const { patientId } = requestBody;

    if (!patientId) {
      Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Patient ID is required"
      );

    }

    console.log(
      `Retrieving diabetic risk assessments for patient ${patientId}`
    );

    // Get all assessments sorted by date
    const allAssessments = await diabeticRiskCalculatorModel
      .find({ user: patientId })
      .sort({ createdAt: -1 })
      .limit(10);

    // If there are no assessments, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      Response.success(
        res,
        [],
        200,
        "No diabetic risk assessments found for this user",
        AppConstant.SUCCESS
      );
      return
    }

    console.log(
      `Found ${allAssessments.length} assessments, latest has risk level: ${allAssessments[0].riskLevel}`
    );

    // Get user data for recommendations
    let userAge: number = 40; // Default age to middle age group if not found
    let userGender: string = "Male"; // Default gender if not found
    let userData: any = null;
    let patientData: any = null;

    try {
      userData = await User.findById(patientId);
      if (userData) {
        if (userData.gender) {
          userGender = userData.gender;
        }

        patientData = await PatientVisitDoctors.findOne({
          user: userData._id,
        });
        if (patientData && patientData.dateOfBirth) {
          userAge =
            new Date().getFullYear() -
            new Date(patientData.dateOfBirth).getFullYear();
        }
        console.log(`User data found: age=${userAge}, gender=${userGender}`);
      } else {
        console.log(`No user data found for ID ${patientId}, using defaults`);
      }
    } catch (err: any) {
      console.error("Error fetching user data:", err);
      console.log("Using default age and gender values");
    }

    // Determine age group
    const ageGroup: AgeGroup = fallbackDetermineDiabeticAgeGroup(userAge);

    // Map gender to appropriate format for recommendations
    const mappedGender: Gender = fallbackMapGenderForDiabeticRecommendations(
      userGender,
      ageGroup
    );

    // Process each assessment and add recommendation
    const assessmentsWithRecommendations: AssessmentWithRecommendation[] = await Promise.all(
      allAssessments.map(async (assessment): Promise<AssessmentWithRecommendation> => {
        // Convert to plain object so we can modify it
        const assessmentObj = assessment.toObject();

        // Get the standardized risk level
        const standardizedRiskLevel: RiskLevel | null =
          assessment.riskLevel === "Low" ||
          assessment.riskLevel === "Moderate" ||
          assessment.riskLevel === "High"
            ? assessment.riskLevel as RiskLevel
            : extractRiskLevelFromLegacy(assessment.riskLevel);

        // Find recommendation for this risk level
        let recommendation: RecommendationData;
        try {
          // First try exact match
          let recommendationDoc = await diabeticRecommendationsModel.findOne({
            ageGroup,
            gender: mappedGender,
            riskLevel: standardizedRiskLevel,
          });

          // If not found, try with "All" gender
          if (!recommendationDoc) {
            recommendationDoc = await diabeticRecommendationsModel.findOne({
              ageGroup,
              gender: "All",
              riskLevel: standardizedRiskLevel,
            });
          }

          // If still not found, try just by risk level
          if (!recommendationDoc) {
            recommendationDoc = await diabeticRecommendationsModel.findOne({
              riskLevel: standardizedRiskLevel,
            });
          }

          // Last resort: use default recommendation
          if (!recommendationDoc) {
            recommendation = {
              dietaryRecommendation:
                standardizedRiskLevel === "High"
                  ? "Follow a strict low-sugar, high-fiber diet."
                  : standardizedRiskLevel === "Moderate"
                    ? "Limit sugar intake and increase vegetables and whole grains."
                    : "Maintain a balanced diet with limited refined carbohydrates.",
              medicalRecommendation:
                standardizedRiskLevel === "High"
                  ? "Consult your doctor regularly for blood sugar monitoring."
                  : standardizedRiskLevel === "Moderate"
                    ? "Schedule regular blood sugar checks every 6 months."
                    : "Annual blood sugar screening is recommended.",
              physicalActivityRecommendation:
                standardizedRiskLevel === "High"
                  ? "Light exercise as approved by your doctor."
                  : standardizedRiskLevel === "Moderate"
                    ? "Moderate exercise 3-4 times per week."
                    : "Regular physical activity for 30 minutes daily.",
            };
          } else {
            // Convert Mongoose document to plain object
            const recommendationObj = recommendationDoc.toObject();

            recommendation = {
              dietaryRecommendation: recommendationObj.dietaryRecommendation,
              medicalRecommendation: recommendationObj.medicalRecommendation,
              physicalActivityRecommendation: recommendationObj.physicalActivityRecommendation,
            };
          }
        } catch (err: any) {
          console.error("Error fetching recommendation:", err);
          // Set default empty recommendation
          recommendation = {
            dietaryRecommendation: "Follow a balanced diet",
            medicalRecommendation: "Consult with healthcare provider",
            physicalActivityRecommendation: "Regular physical activity recommended",
          };
        }

        // Add recommendation directly to assessment object
        return {
          ...assessmentObj,
          user: assessmentObj.user.toString(),
          recommendation,
        } as AssessmentWithRecommendation;
      })
    );

    // Extract user profile data to include in response
    const userProfile: UserProfile = {
      age: userAge,
      gender: userGender,
      name: userData ? userData.name : undefined,
      email: userData ? userData.email : undefined,
      phone: userData ? userData.phoneNumber : undefined,
    };

    const responseData: ResponseData = {
      // userProfile: userProfile,
      assessments: assessmentsWithRecommendations,
    };

    Response.success(
      res,
      responseData,
      200,
      "Diabetic risk assessments found successfully",
      AppConstant.SUCCESS
    );
    return 
  } catch (err: any) {
    Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
    return
  }
};

export {
  createDiabeticRiskCalculator,
  getAllDiabeticRiskCalculatorDateAndRisk,
  updateSampleRecommendation,
};

export type {
  CreateDiabeticRiskRequest,
  GetAllDiabeticRiskRequest,
  DiabeticRiskResult,
  UserProfile,
  RecommendationData,
  AssessmentWithRecommendation,
  ResponseData,
  RiskLevel,
  Gender,
  AgeGroup,
};
