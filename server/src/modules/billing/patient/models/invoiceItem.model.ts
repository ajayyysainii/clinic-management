import { Schema, model, Document, Types } from 'mongoose';

export interface IInvoiceItem extends Document {
  invoice_id: Types.ObjectId;
  type: 'SERVICE' | 'CONSUMABLE';
  name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  // Inventory reference fields for consumables
  inventoryItemId?: Types.ObjectId;
  inventoryQuantity?: number;
  inventoryUnit?: string;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice',},
  type: { type: String, enum: ['SERVICE', 'CONSUMABLE'], },
  name: { type: String,  },
  quantity: { type: Number, },
  unit_price: { type: Number, },
  discount: { type: Number, default: 0 },
  gst_rate: { type: Number, },
  gst_amount: { type: Number, },
  total_amount: { type: Number,},
  // Inventory reference fields for consumables
  inventoryItemId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
  inventoryQuantity: { type: Number },
  inventoryUnit: { type: String },
}, {
  timestamps: true,
  versionKey: false
});

export const InvoiceItem = model<IInvoiceItem>('InvoiceItem', InvoiceItemSchema);
