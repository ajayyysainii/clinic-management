import Joi from 'joi';

// Define enums for better type safety
enum RiskLevel {
  HIGHER = 'higher',
  LOWER = 'lower',
}

// Define interfaces for type safety
interface StrokeRiskCalculatorData {
  user: string;
  bloodPressure?: RiskLevel;
  atrialFibrillation?: RiskLevel;
  bloodSugar?: RiskLevel;
  bmi?: RiskLevel;
  diet?: RiskLevel;
  cholesterol?: RiskLevel;
  diabetes?: RiskLevel;
  physicalActivity?: RiskLevel;
  history?: RiskLevel;
  tobacco?: RiskLevel;
  lowerRiskScore?: number;
  higherRiskScore?: number;
  desc?: string;
}

interface ValidationResult {
  error?: Joi.ValidationError;
  value: StrokeRiskCalculatorData;
}

const strokeRiskCalculatorValidationSchema: Joi.ObjectSchema<StrokeRiskCalculatorData> = Joi.object({
  user: Joi.string().required().messages({
    "any.required": "User is required!",
    "string.empty": "User must not be empty!",
  }),
  bloodPressure: Joi.string().valid(...Object.values(RiskLevel)).optional().messages({
    "any.only": `Blood Pressure must be one of: ${Object.values(RiskLevel).join(', ')}!`,
  }),
  atrialFibrillation: Joi.string()
    .valid(...Object.values(RiskLevel))
    .optional()
    .messages({
      "any.only": `Atrial Fibrillation must be one of: ${Object.values(RiskLevel).join(', ')}!`,
    }),
  bloodSugar: Joi.string().valid(...Object.values(RiskLevel)).optional().messages({
    "any.only": `Blood Sugar must be one of: ${Object.values(RiskLevel).join(', ')}!`,
  }),
  bmi: Joi.string().valid(...Object.values(RiskLevel)).optional().messages({
    "any.only": `BMI must be one of: ${Object.values(RiskLevel).join(', ')}!`,
  }),
  diet: Joi.string().valid(...Object.values(RiskLevel)).optional().messages({
    "any.only": `Diet must be one of: ${Object.values(RiskLevel).join(', ')}!`,
  }),
  cholesterol: Joi.string().valid(...Object.values(RiskLevel)).optional().messages({
    "any.only": `Cholesterol must be one of: ${Object.values(RiskLevel).join(', ')}!`,
  }),
  diabetes: Joi.string().valid(...Object.values(RiskLevel)).optional().messages({
    "any.only": `Diabetes must be one of: ${Object.values(RiskLevel).join(', ')}!`,
  }),
  physicalActivity: Joi.string().valid(...Object.values(RiskLevel)).optional().messages({
    "any.only": `Physical Activity must be one of: ${Object.values(RiskLevel).join(', ')}!`,
  }),
  history: Joi.string().valid(...Object.values(RiskLevel)).optional().messages({
    "any.only": `History must be one of: ${Object.values(RiskLevel).join(', ')}!`,
  }),
  tobacco: Joi.string().valid(...Object.values(RiskLevel)).optional().messages({
    "any.only": `Tobacco must be one of: ${Object.values(RiskLevel).join(', ')}!`,
  }),
  lowerRiskScore: Joi.number().min(0).optional().messages({
    "number.base": "Lower Risk Score must be a number!",
    "number.min": "Lower Risk Score must be at least 0!",
  }),
  higherRiskScore: Joi.number().min(0).optional().messages({
    "number.base": "Higher Risk Score must be a number!",
    "number.min": "Higher Risk Score must be at least 0!",
  }),
  desc: Joi.string().allow("").optional().messages({
    "string.base": "Description must be a string!",
  }),
});

// Utility function to validate data with proper typing
const validateStrokeRiskCalculatorData = (
  data: unknown
): ValidationResult => {
  return strokeRiskCalculatorValidationSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};

export {
  strokeRiskCalculatorValidationSchema,
  validateStrokeRiskCalculatorData,
  RiskLevel
};

export type {
  StrokeRiskCalculatorData,
  ValidationResult
};
