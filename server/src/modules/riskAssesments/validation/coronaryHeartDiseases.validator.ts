import Joi from 'joi';

// Define the validation schema for patientData
const patientDataSchema = Joi.object({
  gender: Joi.string().valid("M", "F", "O").required().messages({
    "any.only": "Gender must be one of 'M', 'F', or 'O'.",
    "any.required": "Gender is required!",
  }),
  age: Joi.number().integer().positive().required().messages({
    "number.base": "Age must be a number.",
    "number.integer": "Age must be an integer.",
    "number.positive": "Age must be a positive number.",
    "any.required": "Age is required!",
  }),
  race: Joi.number().valid(0, 1).required().messages({
    "number.base": "Race must be a number.",
    "any.only": "Race must be either 0 (White) or 1 (African American).",
    "any.required": "Race is required!",
  }),
  systolicBP: Joi.number().positive().required().messages({
    "number.base": "Systolic BP must be a number.",
    "number.positive": "Systolic BP must be a positive number.",
    "any.required": "Systolic BP is required!",
  }),
  onHypertensionMed: Joi.boolean().default(false).messages({
    "boolean.base":
      "onHypertensionMed must be a boolean value (true or false).",
  }),
  diabetes: Joi.boolean().default(false).messages({
    "boolean.base": "Diabetes must be a boolean value (true or false).",
  }),
  smoker: Joi.boolean().default(false).messages({
    "boolean.base": "Smoker must be a boolean value (true or false).",
  }),
  totalCholesterol: Joi.number().positive().required().messages({
    "number.base": "Total cholesterol must be a number.",
    "number.positive": "Total cholesterol must be a positive number.",
    "any.required": "Total cholesterol is required!",
  }),
  hdlCholesterol: Joi.number().positive().required().messages({
    "number.base": "HDL cholesterol must be a number.",
    "number.positive": "HDL cholesterol must be a positive number.",
    "any.required": "HDL cholesterol is required!",
  }),
});

// Define the main validation schema
const coronaryHeartDiseaseValidationSchema = Joi.object({
  user: Joi.string().required().messages({
    "string.base": "User must be a valid ObjectId (string format).",
    "any.required": "User is required!",
  }),
  patientData: patientDataSchema.required().messages({
    "any.required": "Patient data is required!",
  }),
});

// Define TypeScript interface for patient data
interface PatientData {
  gender: 'M' | 'F' | 'O';
  age: number;
  race: 0 | 1;
  systolicBP: number;
  onHypertensionMed?: boolean;
  diabetes?: boolean;
  smoker?: boolean;
  totalCholesterol: number;
  hdlCholesterol: number;
}

// Define TypeScript interface for the validated data
interface CoronaryHeartDiseaseData {
  user: string;
  patientData: PatientData;
}

// Type for Joi validation result
interface ValidationResult {
  error?: Joi.ValidationError;
  value: CoronaryHeartDiseaseData;
}

export { coronaryHeartDiseaseValidationSchema };
export type { CoronaryHeartDiseaseData, PatientData, ValidationResult };
