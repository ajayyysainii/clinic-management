import Joi from 'joi';

// Define enums for better type safety
enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

enum SleepQuality {
  POOR = 'Poor',
  FAIR = 'Fair',
  GOOD = 'Good',
}

enum WorkLifeBalance {
  POOR = 'Poor',
  FAIR = 'Fair',
  GOOD = 'Good',
}

// Define interfaces for type safety
interface PssQuestions {
  upsetByUnexpected: number;
  unableToControl: number;
  feltNervous: number;
  confidentHandling: number;
  thingsGoingWell: number;
  couldNotCope: number;
  controlIrritations: number;
  onTopOfThings: number;
  angryOutOfControl: number;
  difficulties: number;
}

interface AdditionalFactors {
  chronicConditions?: string[];
  sleepQuality?: SleepQuality;
  workLifeBalance?: WorkLifeBalance;
}

interface StressRiskCalculatorData {
  user: string;
  age: number;
  gender: Gender;
  pssQuestions: PssQuestions;
  additionalFactors?: AdditionalFactors;
}

interface ValidationResult {
  error?: Joi.ValidationError;
  value: StressRiskCalculatorData;
}

// Validation schema for stress risk calculator
const stressRiskCalculatorValidationSchema: Joi.ObjectSchema<StressRiskCalculatorData> = Joi.object({
  user: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
  age: Joi.number().required().min(18).messages({
    "number.base": "Age must be a number",
    "number.min": "Age must be at least 18",
    "any.required": "Age is required",
  }),
  gender: Joi.string().valid(...Object.values(Gender)).required().messages({
    "string.empty": "Gender is required",
    "any.required": "Gender is required",
    "any.only": `Gender must be one of: ${Object.values(Gender).join(', ')}`,
  }),
  pssQuestions: Joi.object({
    upsetByUnexpected: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    unableToControl: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    feltNervous: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    confidentHandling: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    thingsGoingWell: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    couldNotCope: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    controlIrritations: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    onTopOfThings: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    angryOutOfControl: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    difficulties: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
  }).required(),
  additionalFactors: Joi.object({
    chronicConditions: Joi.array().items(Joi.string()),
    sleepQuality: Joi.string().valid(...Object.values(SleepQuality)),
    workLifeBalance: Joi.string().valid(...Object.values(WorkLifeBalance)),
  }),
});

// Utility function to validate data with proper typing
const validateStressRiskCalculatorData = (
  data: unknown
): ValidationResult => {
  return stressRiskCalculatorValidationSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};

export {
  stressRiskCalculatorValidationSchema,
  validateStressRiskCalculatorData,
  Gender,
  SleepQuality,
  WorkLifeBalance
};

export type {
  StressRiskCalculatorData,
  PssQuestions,
  AdditionalFactors,
  ValidationResult
};
