import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceRefund extends Document {
  invoice_id: mongoose.Types.ObjectId;
  amount: number;
  refund_mode: 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'INSURANCE';
  processed_by: mongoose.Types.ObjectId;
  timestamp: Date;
}

const InvoiceRefundSchema: Schema = new Schema(
  {
    invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    amount: { type: Number, required: true },
    refund_mode: { type: String, enum: ['CASH', 'CARD', 'UPI', 'WALLET', 'INSURANCE'], required: true },
    processed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, required: true },
  },
  { timestamps: false }
);

export default mongoose.model<IInvoiceRefund>('InvoiceRefund', InvoiceRefundSchema);
