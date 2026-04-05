import Joi from 'joi';

// Define enums for better type safety
enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
}

// Define interfaces for type safety
interface DiabeticRiskCalculatorData {
  user: string;
  // Raw data fields
  age?: number;
  gender?: Gender;
  waistCircumference?: number;
  physicalActivity?: string;
  familyHistory?: string;
  // Score fields
  ageScore: number;
  waistScore: number;
  physicalActivityScore: number;
  familyHistoryScore: number;
  totalScore?: number;
  riskLevel?: string;
}

interface ValidationResult {
  error?: Joi.ValidationError;
  value: DiabeticRiskCalculatorData;
}

interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  convert?: boolean;
  allowUnknown?: boolean;
}

// Custom validation schema
const diabeticRiskCalculatorValidation: Joi.ObjectSchema<DiabeticRiskCalculatorData> = Joi.object({
  user: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.base": "User must be a valid ObjectId as a string.",
      "string.pattern.base": "User must be a valid MongoDB ObjectId.",
      "any.required": "User is required!",
    }),

  // Raw data fields
  age: Joi.number()
    .min(0)
    .max(150)
    .optional()
    .messages({
      "number.base": "Age must be a number.",
      "number.min": "Age cannot be negative.",
      "number.max": "Age must be realistic (under 150).",
    }),

  gender: Joi.string()
    .valid(...Object.values(Gender))
    .optional()
    .messages({
      "string.base": "Gender must be a string.",
      "any.only": `Gender must be one of: ${Object.values(Gender).join(', ')}.`,
    }),

  waistCircumference: Joi.number()
    .min(0)
    .max(300)
    .optional()
    .messages({
      "number.base": "Waist circumference must be a number.",
      "number.min": "Waist circumference cannot be negative.",
      "number.max": "Waist circumference must be realistic (under 300 cm).",
    }),

  physicalActivity: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      "string.base": "Physical activity must be a string.",
      "string.empty": "Physical activity cannot be empty.",
      "string.min": "Physical activity must be at least 1 character.",
      "string.max": "Physical activity cannot exceed 100 characters.",
    }),

  familyHistory: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      "string.base": "Family history must be a string.",
      "string.empty": "Family history cannot be empty.",
      "string.min": "Family history must be at least 1 character.",
      "string.max": "Family history cannot exceed 100 characters.",
    }),

  // Score fields with proper validation ranges
  ageScore: Joi.number()
    .integer()
    .min(0)
    .max(30)
    .default(0)
    .messages({
      "number.base": "Age Score must be a number.",
      "number.integer": "Age Score must be an integer.",
      "number.min": "Age Score cannot be negative.",
      "number.max": "Age Score cannot exceed 30.",
    }),

  waistScore: Joi.number()
    .integer()
    .min(0)
    .max(20)
    .default(0)
    .messages({
      "number.base": "Waist Score must be a number.",
      "number.integer": "Waist Score must be an integer.",
      "number.min": "Waist Score cannot be negative.",
      "number.max": "Waist Score cannot exceed 20.",
    }),

  physicalActivityScore: Joi.number()
    .integer()
    .min(0)
    .max(30)
    .default(0)
    .messages({
      "number.base": "Physical Activity Score must be a number.",
      "number.integer": "Physical Activity Score must be an integer.",
      "number.min": "Physical Activity Score cannot be negative.",
      "number.max": "Physical Activity Score cannot exceed 30.",
    }),

  familyHistoryScore: Joi.number()
    .integer()
    .min(0)
    .max(20)
    .default(0)
    .messages({
      "number.base": "Family History Score must be a number.",
      "number.integer": "Family History Score must be an integer.",
      "number.min": "Family History Score cannot be negative.",
      "number.max": "Family History Score cannot exceed 20.",
    }),

  totalScore: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .default(0)
    .optional()
    .messages({
      "number.base": "Total Score must be a number.",
      "number.integer": "Total Score must be an integer.",
      "number.min": "Total Score cannot be negative.",
      "number.max": "Total Score cannot exceed 100.",
    }),

  riskLevel: Joi.string()
    .trim()
    .valid(...Object.values(RiskLevel), 'Very High') // Allow legacy values
    .optional()
    .messages({
      "string.base": "Risk Level must be a string.",
      "any.only": `Risk Level must be one of: ${Object.values(RiskLevel).join(', ')}, Very High.`,
    }),
})
.custom((obj: DiabeticRiskCalculatorData, helpers) => {
  // Validate that either raw data or scores are provided
  const hasRawData = !!(
    obj.age &&
    obj.waistCircumference &&
    obj.physicalActivity &&
    obj.familyHistory &&
    obj.gender
  );

  const hasScores = !!(
    obj.ageScore !== undefined &&
    obj.waistScore !== undefined &&
    obj.physicalActivityScore !== undefined &&
    obj.familyHistoryScore !== undefined
  );

  if (!hasRawData && !hasScores) {
    return helpers.error('custom.invalid', {
      message:
        'Either provide all raw data (age, waistCircumference, physicalActivity, familyHistory, gender) or all scores (ageScore, waistScore, physicalActivityScore, familyHistoryScore)',
    });
  }

  // Validate total score consistency if provided
  if (obj.totalScore !== undefined && hasScores) {
    const calculatedTotal = obj.ageScore + obj.waistScore + obj.physicalActivityScore + obj.familyHistoryScore;
    if (Math.abs(obj.totalScore - calculatedTotal) > 1) { // Allow small discrepancy
      return helpers.error('custom.totalScore', {
        message: `Total score (${obj.totalScore}) does not match sum of individual scores (${calculatedTotal})`,
      });
    }
  }

  return obj;
});

// Utility function to validate data with proper typing
const validateDiabeticRiskCalculatorData = (
  data: unknown,
  options: ValidationOptions = {}
): ValidationResult => {
  const defaultOptions: ValidationOptions = {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
    allowUnknown: false,
  };

  const validationOptions = { ...defaultOptions, ...options };

  return diabeticRiskCalculatorValidation.validate(data, validationOptions);
};

export {
  diabeticRiskCalculatorValidation,
  validateDiabeticRiskCalculatorData,
  Gender,
  RiskLevel
};

export type {
  DiabeticRiskCalculatorData,
  ValidationResult,
  ValidationOptions
};
