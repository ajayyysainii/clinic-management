import mongoose, { Schema, Document, Types } from 'mongoose';

// Field types enum
enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  URL = 'url',
  DATE = 'date',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  BOOLEAN = 'boolean',
  RANGE = 'range'
}

// Field interface
interface IFormField {
  name: string;
  label: string;
  type: FieldType;
  isRequired: boolean;
  defaultValue?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // For select, radio, checkbox
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  order: number;
}

// Form interface
interface ICustomRiskAssessment extends Document {
  name: string;
  description?: string;
  createdBy: Types.ObjectId; // Doctor who created the form
  clinic: Types.ObjectId;
  fields: IFormField[];
  isActive: boolean;
  scoringLogic?: {
    formula: string; // e.g., "field1 + field2 * 2"
    riskLevels: {
      low: { min: number; max: number };
      moderate: { min: number; max: number };
      high: { min: number; max: number };
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const FormFieldSchema = new Schema<IFormField>({
  name: {
    type: String,
    required: [true, "Field name is required"],
    trim: true
  },
  label: {
    type: String,
    required: [true, "Field label is required"],
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(FieldType),
    required: [true, "Field type is required"]
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  defaultValue: {
    type: Schema.Types.Mixed
  },
  placeholder: {
    type: String,
    trim: true
  },
  min: {
    type: Number
  },
  max: {
    type: Number
  },
  step: {
    type: Number
  },
  options: [{
    type: String,
    trim: true
  }],
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    message: String
  },
  order: {
    type: Number,
    required: true
  }
});

const CustomRiskAssessmentSchema = new Schema<ICustomRiskAssessment>({
  name: {
    type: String,
    required: [true, "Form name is required"],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Doctor is required"]
  },
  clinic: {
    type: Schema.Types.ObjectId,
    ref: "Clinic",
    required: [true, "Clinic is required"]
  },
  fields: [FormFieldSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  scoringLogic: {
    formula: {
      type: String,
      trim: true
    },
    riskLevels: {
      low: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 30 }
      },
      moderate: {
        min: { type: Number, default: 31 },
        max: { type: Number, default: 60 }
      },
      high: {
        min: { type: Number, default: 61 },
        max: { type: Number, default: 100 }
      }
    }
  }
}, { timestamps: true });

// Create and export the model
const CustomRiskAssessment = mongoose.model<ICustomRiskAssessment>(
  "CustomRiskAssessment",
  CustomRiskAssessmentSchema
);

export default CustomRiskAssessment;
export {
  ICustomRiskAssessment,
  IFormField,
  FieldType
};
