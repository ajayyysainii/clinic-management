import mongoose, { Document, Schema, Types } from 'mongoose'

// Enum for service categories
export enum ServiceCategory {
  CONSULTATION = 'consultation',
  PROCEDURE = 'procedure',
  TEST = 'test',
  TREATMENT = 'treatment',
  SURGERY = 'surgery',
  OTHER = 'other',
}

// Interface for the document
export interface IService extends Document {
  clinicId: Types.ObjectId
  serviceName: string
  description?: string
  category: ServiceCategory
  basePrice: number
  sellingPrice?: number
  duration?: number // in minutes
  isActive: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Schema definition
const serviceSchema = new Schema<IService>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(ServiceCategory),
      required: true,
      default: ServiceCategory.OTHER,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      min: 0,
    },
    duration: {
      type: Number,
      min: 0,
      default: 30, // default 30 minutes
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
serviceSchema.index({ clinicId: 1, deletedAt: 1 })
serviceSchema.index({ serviceName: 1, clinicId: 1 })
serviceSchema.index({ category: 1, clinicId: 1 })

// Pre-save middleware to set selling price if not provided
serviceSchema.pre('save', function (next) {
  if (!this.sellingPrice) {
    this.sellingPrice = this.basePrice
  }
  next()
})

export const Service = mongoose.model<IService>('Service', serviceSchema)
