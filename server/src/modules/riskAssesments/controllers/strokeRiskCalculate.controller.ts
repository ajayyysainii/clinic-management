import { Request, Response as ExpressResponse } from 'express';
import AppConstant from '../../../utils/AppConstants';
import Response from '../../../utils/Response';
import { strokeRiskCalculatorValidationSchema } from '../validation/strokeRiskCalculator.validator'
import strokeRiskCalculatorModel from '../models/strokeRiskCalculator.model';
import strokeRecommendationsModel from '../models/strokeRecommendations.model';
import { calculateStrokeRiskHelper } from '../helpers/strokeRiskCalculator.helper';
import { determineStrokeRiskLevel } from '../../../utils/riskAssesments/strokeRiskUtils';

// Define interfaces
interface RiskFactors {
  bloodPressure?: string;
  atrialFibrillation?: string;
  bloodSugar?: string;
  bmi?: string;
  diet?: string;
  cholesterol?: string;
  diabetes?: string;
  physicalActivity?: string;
  history?: string;
  tobacco?: string;
  [key: string]: string | undefined;
}

interface CreateStrokeRiskRequest extends RiskFactors {
  user: string;
}

interface GetAllStrokeRiskRequest {
  patientId: string;
}

interface CustomRequest extends Request {
  body: CreateStrokeRiskRequest | GetAllStrokeRiskRequest;
}

interface StrokeRiskResult {
  higherRiskScore: number;
  lowerRiskScore: number;
  desc: string;
}

interface RecommendationData {
  dietRecommendation: string;
  medicalRecommendation: string;
  physicalActivityRecommendation: string;
}

interface AssessmentWithRecommendations {
  _id: string;
  lowerRiskScore: number;
  higherRiskScore: number;
  totalScore: number;
  riskLevel: string;
  desc: string;
  recommendations: RecommendationData | null;
  createdAt: Date;
}

type RiskLevel = 'Low' | 'Moderate' | 'High';

// Fallback utility function in case import fails
const fallbackDetermineStrokeRiskLevel = (lowerRiskScore: number, higherRiskScore: number): RiskLevel => {
  const totalScore = lowerRiskScore + higherRiskScore;

  if (totalScore <= 2) {
    return "Low";
  } else if (totalScore >= 3 && totalScore <= 6) {
    return "Moderate";
  } else {
    return "High"; // totalScore >= 7
  }
};

// create
const createStrokeRiskCalculator = async (
  req: Request,
  res: ExpressResponse
): Promise<void> => {
  try {
    const { error } = strokeRiskCalculatorValidationSchema.validate(req.body);
    if (error) {
      Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation error !"
      );
      return
    }

    const requestBody = req.body as CreateStrokeRiskRequest;

    // Calculate risk scores and description
    const riskFactors: RiskFactors = {
      bloodPressure: requestBody.bloodPressure,
      atrialFibrillation: requestBody.atrialFibrillation,
      bloodSugar: requestBody.bloodSugar,
      bmi: requestBody.bmi,
      diet: requestBody.diet,
      cholesterol: requestBody.cholesterol,
      diabetes: requestBody.diabetes,
      physicalActivity: requestBody.physicalActivity,
      history: requestBody.history,
      tobacco: requestBody.tobacco,
    };

    const { higherRiskScore, lowerRiskScore, desc }: StrokeRiskResult =
      calculateStrokeRiskHelper(riskFactors);

    // Create new stroke risk assessment
    const newStrokeRisk = new strokeRiskCalculatorModel({
      ...requestBody,
      higherRiskScore,
      lowerRiskScore,
      desc,
    });

    const savedStrokeRisk = await newStrokeRisk.save();

    Response.success(
      res,
      savedStrokeRisk,
      201,
      "Stroke risk assessment created successfully!",
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

// Get all stroke risk assessments with recommendations
const getAllStrokeRiskCalculatorDateAndLowerHigherVal = async (
  req: Request,
  res: ExpressResponse
): Promise<void> => {
  try {
    const requestBody = req.body as GetAllStrokeRiskRequest;
    const { patientId } = requestBody;

    if (!patientId) {
      Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Patient ID is required"
      );
      return;
    }

    // Get all assessments sorted by date
    const allAssessments = await strokeRiskCalculatorModel
      .find(
        { user: patientId },
        "lowerRiskScore higherRiskScore desc createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(10);

    // If there are no assessments, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      Response.success(
        res,
        [],
        200,
        "No stroke risk assessments found for this user",
        AppConstant.SUCCESS
      );
      return
    }

    // Process each assessment to include recommendations
    const assessmentsWithRecommendations: AssessmentWithRecommendations[] = await Promise.all(
      allAssessments.map(async (assessment): Promise<AssessmentWithRecommendations> => {
        const lowerRiskScore: number = assessment.lowerRiskScore || 0;
        const higherRiskScore: number = assessment.higherRiskScore || 0;

        // Use imported function with fallback for risk level
        const getRiskLevel =
          typeof determineStrokeRiskLevel === "function"
            ? determineStrokeRiskLevel
            : fallbackDetermineStrokeRiskLevel;

        // Calculate mean score and determine risk level
        const riskLevel: string = getRiskLevel(lowerRiskScore, higherRiskScore);

        // Fetch recommendations for this assessment
        const recommendationData = await strokeRecommendationsModel.findOne({
          riskLevel,
        });

        // If recommendation found, include it with the assessment
        let recommendations: RecommendationData | null = null;
        if (recommendationData) {
          recommendations = {
            dietRecommendation: recommendationData.dietRecommendation,
            medicalRecommendation: recommendationData.medicalRecommendation,
            physicalActivityRecommendation:
              recommendationData.physicalActivityRecommendation,
          };
        }

        // Return assessment with embedded recommendations
        return {
          _id: (assessment._id as any).toString(),
          lowerRiskScore: assessment.lowerRiskScore,
          higherRiskScore: assessment.higherRiskScore,
          totalScore: lowerRiskScore + higherRiskScore,
          riskLevel: riskLevel,
          desc: assessment.desc || '',
          recommendations: recommendations,
          createdAt: assessment.createdAt || new Date(),
        };
      })
    );

    Response.success(
      res,
      assessmentsWithRecommendations,
      200,
      "Stroke risk assessments and recommendations found successfully",
      AppConstant.SUCCESS
    );
    return
  } catch (err: any) {
    console.error("Error fetching stroke risk data:", err);
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
  createStrokeRiskCalculator,
  getAllStrokeRiskCalculatorDateAndLowerHigherVal,
};

export type {
  RiskFactors,
  CreateStrokeRiskRequest,
  GetAllStrokeRiskRequest,
  StrokeRiskResult,
  RecommendationData,
  AssessmentWithRecommendations,
  RiskLevel,
};
