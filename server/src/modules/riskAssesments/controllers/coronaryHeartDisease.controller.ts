import { Request, Response  } from 'express';
import mongoose from 'mongoose';
import AppConstant from '../../../utils/AppConstants';
import ResponseU from '../../../utils/Response';
import CoronaryHeartDiseaseSchema from '../models/coronaryHeartDisease.model'
import { calculateRisk } from '../helpers/DiseaseAssessmentHelper.helper'
import { coronaryHeartDiseaseValidationSchema } from '../validation/coronaryHeartDiseases.validator';
import {
  determineRiskLevel,
  determineAgeGroup,
} from '../../../utils/riskAssesments/coronaryRiskUtils'

// Define interfaces for type safety
interface PatientData {
  age?: number;
  gender?: string;
  systolicBP?: number;
  diastolicBP?: number;
  cholesterol?: number;
  hdlCholesterol?: number;
  smoking?: boolean;
  diabetes?: boolean;
  familyHistory?: boolean;
  [key: string]: any; // For additional properties
}

interface RequestBody extends PatientData {
  user?: any;
}

interface CustomRequest extends Request {
  body: RequestBody;
}

// Create these utility functions locally in case the import fails
const fallbackDetermineRiskLevel = (riskPercentage: number): string => {
  if (riskPercentage < 5) {
    return "Low";
  } else if (riskPercentage >= 5 && riskPercentage < 20) {
    return "Moderate";
  } else if (riskPercentage >= 20 && riskPercentage < 30) {
    return "High";
  } else {
    return "Very High";
  }
};

const fallbackDetermineAgeGroup = (age: number): string => {
  if (age <= 30) {
    return "18-30";
  } else if (age > 30 && age <= 45) {
    return "31-45";
  } else if (age > 45 && age <= 60) {
    return "46-60";
  } else {
    return "61+";
  }
};

// create
const createCoronaryHeartDisease = async (req: Request,res: Response): Promise<void> => {
  try {
    const { error } = coronaryHeartDiseaseValidationSchema.validate(req.body);
    if (error) {
      ResponseU.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation error !"
      );
      return;
    }

    const { patientData } = req.body;
    // console.log(patientData);

    const riskPercentage: number = calculateRisk(patientData);

    const newCoronaryHeartDisease = new CoronaryHeartDiseaseSchema({
      user: req.body.user,
      ...patientData,
      riskPercentage,
    });
    const savedCoronaryHeartDisease = await newCoronaryHeartDisease.save();

    ResponseU.success(
      res,
      savedCoronaryHeartDisease,
      201,
      AppConstant.SUCCESS
    );
    return
  } catch (err: any) {
    ResponseU.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
    return;
  }
};

export { createCoronaryHeartDisease };
