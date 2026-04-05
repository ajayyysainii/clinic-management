import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceDiscount extends Document {
  invoice_id: mongoose.Types.ObjectId;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  applied_by: mongoose.Types.ObjectId;
  reason: string;
}

const InvoiceDiscountSchema: Schema = new Schema(
  {
    invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice'},
    type: { type: String, enum: ['PERCENTAGE', 'FIXED']},
    value: { type: Number},
    reason: { type: String},
  },
  { timestamps: true }
);

export default mongoose.model<IInvoiceDiscount>('InvoiceDiscount', InvoiceDiscountSchema);
