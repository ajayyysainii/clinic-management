import mongoose, { Schema, Document, Types } from 'mongoose';

// Response interface
interface ICustomRiskAssessmentResponse extends Document {
  formId: Types.ObjectId; // Reference to the custom form
  patientId: Types.ObjectId; // Patient who filled the form
  doctorId: Types.ObjectId; // Doctor who created the form
  clinic: Types.ObjectId;
  responses: {
    fieldName: string;
    value: any;
  }[];
  calculatedScore?: number;
  riskLevel?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const ResponseSchema = new Schema({
  fieldName: {
    type: String,
    required: [true, "Field name is required"]
  },
  value: {
    type: Schema.Types.Mixed,
    required: [true, "Field value is required"]
  }
});

const CustomRiskAssessmentResponseSchema = new Schema<ICustomRiskAssessmentResponse>({
  formId: {
    type: Schema.Types.ObjectId,
    ref: "CustomRiskAssessment",
    required: [true, "Form ID is required"]
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Patient ID is required"]
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Doctor ID is required"]
  },
  clinic: {
    type: Schema.Types.ObjectId,
    ref: "Clinic",
    required: [true, "Clinic is required"]
  },
  responses: [ResponseSchema],
  calculatedScore: {
    type: Number
  },
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'very_high'],
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Create and export the model
const CustomRiskAssessmentResponse = mongoose.model<ICustomRiskAssessmentResponse>(
  "CustomRiskAssessmentResponse",
  CustomRiskAssessmentResponseSchema
);

export default CustomRiskAssessmentResponse;
export {
  ICustomRiskAssessmentResponse
};
