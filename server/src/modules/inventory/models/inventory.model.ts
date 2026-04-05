import mongoose, { Document, Schema, Types } from 'mongoose'

// Enum for inventory categories
export enum InventoryCategory {
  MEDICINE = 'medicine',
  EQUIPMENT = 'equipment',
  SUPPLIES = 'supplies',
  CONSUMABLES = 'consumables',
  OTHER = 'other',
}

// Enum for unit types
export enum UnitType {
  PIECES = 'pieces',
  BOXES = 'boxes',
  BOTTLES = 'bottles',
  PACKS = 'packs',
  UNITS = 'units',
  KILOGRAMS = 'kg',
  GRAMS = 'g',
  LITERS = 'l',
  MILLILITERS = 'ml',
}

// Interface for the document
export interface IInventory extends Document {
  clinicId: Types.ObjectId
  itemName: string
  description?: string
  category: InventoryCategory
  quantity: number
  unit: UnitType
  minQuantity: number
  supplier?: string
  supplierContact?: string
  costPrice: number
  sellingPrice?: number
  expiryDate?: Date
  location?: string
  barcode?: string
  sku?: string
  isActive: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Schema definition
const inventorySchema = new Schema<IInventory>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    itemName: {
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
      enum: Object.values(InventoryCategory),
      required: true,
      default: InventoryCategory.OTHER,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      enum: Object.values(UnitType),
      required: true,
      default: UnitType.PIECES,
    },
    minQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    supplier: {
      type: String,
      trim: true,
    },
    supplierContact: {
      type: String,
      trim: true,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      min: 0,
    },
    expiryDate: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
inventorySchema.index({ clinicId: 1, deletedAt: 1 })
inventorySchema.index({ itemName: 1, clinicId: 1 })
inventorySchema.index({ category: 1, clinicId: 1 })

export const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema)
