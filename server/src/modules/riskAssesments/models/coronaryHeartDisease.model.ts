import mongoose, { Schema, Document } from "mongoose";

// Interface for the document
export interface ICoronaryHeartDiseaseAssessment extends Document {
  user: mongoose.Schema.Types.ObjectId;
  gender: "Male" | "Female" | "Other" | "M" | "F" | "O";
  age: number;
  race: 0 | 1; // 0 = white, 1 = african American
  systolicBP: number;
  onHypertensionMed: boolean;
  diabetes: boolean;
  smoker: boolean;
  totalCholesterol: number;
  hdlCholesterol: number;
  riskPercentage?: number;
  riskLevel?: "Low" | "Moderate" | "High" | "Very High";
  createdAt: Date;
  updatedAt: Date;
}

const CoronaryHeartDiseaseSchema: Schema<ICoronaryHeartDiseaseAssessment> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "M", "F", "O"],
      required: [true, "gender is required !"],
    },
    age: {
      type: Number,
      required: [true, "age is required !"],
    },
    // race 0= white, 1 = african American
    race: {
      type: Number,
      enum: [0, 1],
      required: [true, "race is required !"],
    },
    systolicBP: {
      type: Number,
      required: [true, "systolicBP is required !"],
    },
    onHypertensionMed: {
      type: Boolean,
      default: false,
    },
    diabetes: {
      type: Boolean,
      default: false,
    },
    smoker: {
      type: Boolean,
      default: false,
    },
    totalCholesterol: {
      type: Number,
      required: [true, "total Cholesterol is required !"],
    },
    hdlCholesterol: {
      type: Number,
      required: [true, "hdl Cholesterol is required !"],
    },
    riskPercentage: {
      type: Number,
      //   required: [true, "risk Percentage is required !"],
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Moderate", "High", "Very High"],
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICoronaryHeartDiseaseAssessment>(
  "CoronaryHeartDiseaseAssessment",
  CoronaryHeartDiseaseSchema
);
