import Joi from 'joi';

// Define enums for better type safety
enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

// Define interfaces for type safety
interface PhqQuestions {
  littleInterest: number;
  feelingDown: number;
  sleepIssues: number;
  feelingTired: number;
  appetiteIssues: number;
  feelingBad: number;
  concentrationIssues: number;
  movingSpeaking: number;
  suicidalThoughts: number;
}

interface AdditionalFactors {
  chronicConditions?: string[];
  medicationUse?: string[];
  pastTreatment?: string;
  sleepHours?: number;
}

interface DepressionRiskCalculatorData {
  user: string;
  age: number;
  gender: Gender;
  phqQuestions: PhqQuestions;
  additionalFactors?: AdditionalFactors;
}

interface ValidationResult {
  error?: Joi.ValidationError;
  value: DepressionRiskCalculatorData;
}

// Helper function to create PHQ question validation
const createPhqQuestionValidation = (questionName: string) => {
  return Joi.number().min(0).max(3).required().messages({
    "number.base": `${questionName} answer must be a number between 0-3`,
    "number.min": `${questionName} answer must be at least 0`,
    "number.max": `${questionName} answer must be at most 3`,
    "any.required": `${questionName} question is required`,
  });
};

// Validation schema for depression risk calculator
const depressionRiskCalculatorValidationSchema: Joi.ObjectSchema<DepressionRiskCalculatorData> = Joi.object({
  user: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
  age: Joi.number().required().min(18).max(120).messages({
    "number.base": "Age must be a number",
    "number.min": "Age must be at least 18",
    "number.max": "Age must not exceed 120",
    "any.required": "Age is required",
  }),
  gender: Joi.string().valid(...Object.values(Gender)).required().messages({
    "string.empty": "Gender is required",
    "any.required": "Gender is required",
    "any.only": `Gender must be one of: ${Object.values(Gender).join(', ')}`,
  }),
  phqQuestions: Joi.object({
    littleInterest: createPhqQuestionValidation("Little interest or pleasure"),
    feelingDown: createPhqQuestionValidation("Feeling down, depressed, or hopeless"),
    sleepIssues: createPhqQuestionValidation("Sleep issues"),
    feelingTired: createPhqQuestionValidation("Feeling tired or low energy"),
    appetiteIssues: createPhqQuestionValidation("Appetite issues"),
    feelingBad: createPhqQuestionValidation("Feeling bad about yourself"),
    concentrationIssues: createPhqQuestionValidation("Concentration issues"),
    movingSpeaking: createPhqQuestionValidation("Moving or speaking slowly/restlessly"),
    suicidalThoughts: createPhqQuestionValidation("Suicidal thoughts"),
  }).required().messages({
    "any.required": "PHQ questions are required",
  }),
  additionalFactors: Joi.object({
    chronicConditions: Joi.array().items(
      Joi.string().trim().min(1).max(100).messages({
        "string.empty": "Chronic condition cannot be empty",
        "string.min": "Chronic condition must be at least 1 character",
        "string.max": "Chronic condition cannot exceed 100 characters",
      })
    ).max(10).messages({
      "array.max": "Cannot have more than 10 chronic conditions",
    }),
    medicationUse: Joi.array().items(
      Joi.string().trim().min(1).max(100).messages({
        "string.empty": "Medication cannot be empty",
        "string.min": "Medication must be at least 1 character",
        "string.max": "Medication cannot exceed 100 characters",
      })
    ).max(20).messages({
      "array.max": "Cannot have more than 20 medications",
    }),
    pastTreatment: Joi.string().trim().max(500).messages({
      "string.max": "Past treatment description cannot exceed 500 characters",
    }),
    sleepHours: Joi.number().min(0).max(24).messages({
      "number.base": "Sleep hours must be a number",
      "number.min": "Sleep hours must be at least 0",
      "number.max": "Sleep hours cannot exceed 24",
    }),
  }).messages({
    "object.base": "Additional factors must be an object",
  }),
});

// Utility function to validate data with proper typing
const validateDepressionRiskCalculatorData = (
  data: unknown
): ValidationResult => {
  return depressionRiskCalculatorValidationSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
};

export {
  depressionRiskCalculatorValidationSchema,
  validateDepressionRiskCalculatorData,
  Gender
};

export type {
  DepressionRiskCalculatorData,
  PhqQuestions,
  AdditionalFactors,
  ValidationResult
};
