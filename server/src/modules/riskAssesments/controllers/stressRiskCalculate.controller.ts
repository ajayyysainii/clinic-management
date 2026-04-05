import { Request, Response as ExpressResponse } from 'express';
import AppConstant from '../../../utils/AppConstants';
import Response from '../../../utils/Response';
import PatientStress from '../models/patientStress.model';
import { stressRiskCalculatorValidationSchema } from '../validation/stressRiskCalculator.validator';
import stressRiskCalculateModel from '../models/stressRiskCalculate.model';
import stressRecommendationsModel from '../models/stressRecommendations.model';
import {
  calculateStressRiskHelper,determineStressLevel} from '../helpers/stressRiskCalculator.helper';

// Define interfaces
interface PssQuestions {
  upsetByUnexpected?: number;
  unableToControl?: number;
  feltNervous?: number;
  confidentHandling?: number;
  thingsGoingWell?: number;
  couldNotCope?: number;
  controlIrritations?: number;
  onTopOfThings?: number;
  angryOutOfControl?: number;
  difficulties?: number;
}

interface AdditionalFactors {
  chronicConditions?: string[];
  sleepQuality?: string;
  workLifeBalance?: string;
}

interface RequestBody {
  user: string;
  age: number;
  gender: string;
  pssQuestions: PssQuestions;
  additionalFactors?: AdditionalFactors;
  patientId?: string;
}

interface CustomRequest extends Request {
  body: RequestBody;
  query: {
    patientId?: string;
  };
}

interface StressRiskResult {
  pssScore: number;
  stressLevel: string;
}

interface RecommendationData {
  dietaryRecommendation: string;
  physicalActivityRecommendation: string;
  mentalSupportRecommendation: string;
}

interface AssessmentWithRecommendations {
  _id: string;
  pssScore: number;
  stressLevel: string;
  age: number;
  gender: string;
  ageGroup: string;
  recommendations: RecommendationData | null;
  createdAt: Date;
}

interface QuestionMapping {
  questionKey: string;
  score: number;
}

type AgeGroup = '18-40' | '41-60' | '60+';

// Helper function to determine age group
const getAgeGroup = (age: number): AgeGroup => {
  if (age <= 40) return "18-40";
  else if (age <= 60) return "41-60";
  else return "60+";
};

// Map incoming question keys to schema enum values
const mapQuestionKeys: Record<string, string> = {
  upsetByUnexpected: "unexpectedEvents",
  unableToControl: "controlImportantThings",
  feltNervous: "nervousStressed",
  confidentHandling: "handleProblems",
  thingsGoingWell: "goingYourWay",
  couldNotCope: "copeWithThings",
  angryOutOfControl: "controlIrritations",
  difficulties: "difficultiesPilingUp",
};

// Create stress risk calculator entry
const createStressRiskCalculator = async (
  req: Request,
  res: ExpressResponse
): Promise<void> => {
  try {
    // Validate request body
    const { error } = stressRiskCalculatorValidationSchema.validate(req.body);
    if (error) {
      Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation error!"
      );
      return
    }

    // Calculate stress score and level using helper function
    const { pssScore, stressLevel }: StressRiskResult = calculateStressRiskHelper(req.body);

    // Create new stress risk assessment
    const newStressRisk = new stressRiskCalculateModel({
      user: req.body.user,
      age: req.body.age,
      gender: req.body.gender,
      pssQuestions: req.body.pssQuestions,
      additionalFactors: req.body.additionalFactors,
      pssScore,
      stressLevel,
    });

    // Get recommendations based on stress level, age group, and gender
    const ageGroup: AgeGroup = getAgeGroup(req.body.age);
    const recommendationData = await stressRecommendationsModel.findOne({
      riskLevel: stressLevel,
      ageGroup: ageGroup,
      gender: req.body.gender,
    });

    // Create entry in PatientStress collection for health tracking
    const patientStressEntry = new PatientStress({
      patientId: req.body.user,
      totalScore: pssScore,
      stressLevel: stressLevel,
      recommendation: recommendationData
        ? recommendationData.dietaryRecommendation
        : "No specific recommendations available.",
      addedBy: "Doctor",
      questions: Object.entries(req.body.pssQuestions).map(([key, value]): QuestionMapping => ({
        questionKey: mapQuestionKeys[key] || key,
        score: value as number,
      })),
    });

    // Save both entries
    await patientStressEntry.save();
    const savedStressRisk = await newStressRisk.save();

    Response.success(
      res,
      savedStressRisk,
      201,
      "Stress risk assessment calculated successfully!",
      AppConstant.SUCCESS
    );
    return
  } catch (err: any) {
    if (err.name === "ValidationError") {
      const errorMessages: string[] = Object.values(err.errors).map(
        (error: any) => error.message
      );
      Response.error(
        res,
        400,
        AppConstant.FAILED,
        errorMessages.join(", ") || "Validation error!"
      );
      return
    }
    Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
    return
  }
};

// Get all stress risk assessments with recommendations
const getAllStressRiskCalculator = async (
  req: Request,
  res: ExpressResponse
): Promise<void> => {
  try {
    // Get patientId from either query parameters or request body
    const patientId: string | undefined = req.query.patientId || req.body.patientId;

    if (!patientId) {
      Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Patient ID is required"
      );
      return
    }

    // Get the last 10 assessments sorted by date
    const allAssessments = await stressRiskCalculateModel
      .find({ user: patientId })
      .sort({ createdAt: -1 })
      .limit(10);

    // If no assessments found, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      Response.success(
        res,
        [],
        200,
        "No stress risk assessments found for this user",
        AppConstant.SUCCESS
      );
      return
    }

    // Process each assessment to include recommendations
    const assessmentsWithRecommendations: AssessmentWithRecommendations[] = await Promise.all(
      allAssessments.map(async (assessment): Promise<AssessmentWithRecommendations> => {
        // Determine age group for recommendations
        const ageGroup: AgeGroup = getAgeGroup(assessment.age);

        // Find appropriate recommendation based on risk level, age group, and gender
        const recommendationData = await stressRecommendationsModel.findOne({
          riskLevel: assessment.stressLevel,
          ageGroup: ageGroup,
          gender: assessment.gender,
        });

        // If recommendation found, include it with the assessment
        let recommendations: RecommendationData | null = null;
        if (recommendationData) {
          recommendations = {
            dietaryRecommendation: recommendationData.dietaryRecommendation,
            physicalActivityRecommendation:
              recommendationData.physicalActivityRecommendation,
            mentalSupportRecommendation:
              recommendationData.mentalSupportRecommendation,
          };
        }

        // Return assessment with embedded recommendations
        return {
          _id: (assessment._id as any)?.toString() || '',
          pssScore: assessment.pssScore,
          stressLevel: assessment.stressLevel,
          age: assessment.age,
          gender: assessment.gender,
          ageGroup: ageGroup,
          recommendations: recommendations,
          createdAt: assessment.createdAt || new Date(),
        };
      })
    );

    Response.success(
      res,
      assessmentsWithRecommendations,
      200,
      "Stress risk assessments and recommendations found successfully",
      AppConstant.SUCCESS
    );
    return
  } catch (err: any) {
    console.error("Error fetching stress risk data:", err);
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
  createStressRiskCalculator,
  getAllStressRiskCalculator,
};

export type {
  PssQuestions,
  AdditionalFactors,
  RequestBody,
  StressRiskResult,
  RecommendationData,
  AssessmentWithRecommendations,
  AgeGroup,
};
