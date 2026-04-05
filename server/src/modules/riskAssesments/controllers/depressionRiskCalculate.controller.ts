import { Request, Response as ExpressResponse } from 'express';
import AppConstant from '../../../utils/AppConstants';
import Response from '../../../utils/Response';
import PatientDepression from '../models/patientDepression.model';
import { depressionRiskCalculatorValidationSchema } from '../validation/depressionRiskCalculator.validator'
import depressionRiskCalculateModel from '../models/depressionRiskCalculate.model';
import depressionRecommendationsModel from '../models/depressionRecommendations.model';
import {
  calculateDepressionRiskHelper,
  determineDepressionLevel,
} from '../helpers/depressionRiskCalculator.helper';

// Define interfaces
interface PhqQuestions {
  littleInterest?: number;
  feelingDown?: number;
  sleepIssues?: number;
  feelingTired?: number;
  appetiteIssues?: number;
  feelingBad?: number;
  concentrationIssues?: number;
  movingSpeaking?: number;
  suicidalThoughts?: number;
}

interface AdditionalFactors {
  chronicConditions?: string[];
  medicationUse?: string[];
  pastTreatment?: string;
  sleepHours?: number;
}

interface RequestBody {
  user: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phqQuestions: PhqQuestions;
  additionalFactors?: AdditionalFactors;
  patientId?: string;
}

interface CustomRequest extends Request {
  body: RequestBody;
  query: {
    patientId?: string;
  };
}

interface DepressionRiskResult {
  phqScore: number;
  depressionLevel: string;
}

interface RecommendationData {
  dietaryRecommendation: string;
  activityRecommendation: string;
  supportRecommendation: string;
}

interface AssessmentWithRecommendations {
  _id: string;
  phqScore: number;
  depressionLevel: string;
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
  littleInterest: "interestPleasure",
  feelingDown: "downDepressedHopeless",
  sleepIssues: "sleepIssues",
  feelingTired: "tiredLowEnergy",
  appetiteIssues: "appetiteIssues",
  feelingBad: "feelingBadFailure",
  concentrationIssues: "concentrationIssues",
  movingSpeaking: "movementIssues",
  suicidalThoughts: "selfHarmThoughts",
};

// Create depression risk calculator entry
const createDepressionRiskCalculator = async (req: Request,res: ExpressResponse
): Promise<void> => {
  try {
    // Validate request body
    const { error } = depressionRiskCalculatorValidationSchema.validate(req.body);
    if (error) {
      Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation error!"
      );
      return
    }

    // Calculate depression score and level using helper function
    const { phqScore, depressionLevel }: DepressionRiskResult = calculateDepressionRiskHelper(req.body);

    // Create new depression risk assessment
    const newDepressionRisk = new depressionRiskCalculateModel({
      user: req.body.user,
      age: req.body.age,
      gender: req.body.gender,
      phqQuestions: req.body.phqQuestions,
      additionalFactors: req.body.additionalFactors,
      phqScore,
      depressionLevel,
    });

    // Get recommendations based on depression level, age group, and gender
    const ageGroup: AgeGroup = getAgeGroup(req.body.age);
    const recommendationData = await depressionRecommendationsModel.findOne({
      depressionLevel: depressionLevel,
      ageGroup: ageGroup,
      gender: req.body.gender,
    });

    // Create entry in PatientDepression collection for health tracking
    const patientDepressionEntry = new PatientDepression({
      patientId: req.body.user,
      totalScore: phqScore,
      depressionLevel: depressionLevel,
      recommendation: recommendationData
        ? recommendationData.dietaryRecommendation
        : "No specific recommendations available.",
      addedBy: "Doctor",
      selfHarmRisk:
        depressionLevel === "Severe" || depressionLevel === "ModeratelySevere",
      questions: Object.entries(req.body.phqQuestions).map(([key, value]): QuestionMapping => ({
        questionKey: mapQuestionKeys[key] || key,
        score: value as number,
      })),
    });

    // Save both entries
    await patientDepressionEntry.save();
    const savedDepressionRisk = await newDepressionRisk.save();

    Response.success(
      res,
      savedDepressionRisk,
      201,
      "Depression risk assessment calculated successfully!",
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

// Get all depression risk assessments with recommendations
const getAllDepressionRiskCalculator = async (req: Request,res: ExpressResponse): Promise<void> => {
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
    const allAssessments = await depressionRiskCalculateModel
      .find({ user: patientId })
      .sort({ createdAt: -1 })
      .limit(10);

    // If no assessments found, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      Response.success(
        res,
        [],
        200,
        "No depression risk assessments found for this user",
        AppConstant.SUCCESS
      );
      return
    }

    // Process each assessment to include recommendations
    const assessmentsWithRecommendations: AssessmentWithRecommendations[] = await Promise.all(
      allAssessments.map(async (assessment: any): Promise<AssessmentWithRecommendations> => {
        // Determine age group for recommendations
        const ageGroup: AgeGroup = getAgeGroup(assessment.age);

        // Find appropriate recommendation based on risk level, age group, and gender
        const recommendationData = await depressionRecommendationsModel.findOne({
          depressionLevel: assessment.depressionLevel,
          ageGroup: ageGroup,
          gender: assessment.gender,
        });

        // If recommendation found, include it with the assessment
        let recommendations: RecommendationData | null = null;
        if (recommendationData) {
          recommendations = {
            dietaryRecommendation: recommendationData.dietaryRecommendation,
            activityRecommendation: recommendationData.activityRecommendation,
            supportRecommendation: recommendationData.supportRecommendation,
          };
        }

        // Return assessment with embedded recommendations
        return {
          _id: assessment._id?.toString() || '',
          phqScore: assessment.phqScore,
          depressionLevel: assessment.depressionLevel,
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
      "Depression risk assessments and recommendations found successfully",
      AppConstant.SUCCESS
    );
    return 
  } catch (err: any) {
    console.error("Error fetching depression risk data:", err);
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
  createDepressionRiskCalculator,
  getAllDepressionRiskCalculator,
};

export type {
  PhqQuestions,
  AdditionalFactors,
  RequestBody,
  DepressionRiskResult,
  RecommendationData,
  AssessmentWithRecommendations,
  AgeGroup,
};
