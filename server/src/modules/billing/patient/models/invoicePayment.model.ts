import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoicePayment extends Document {
  invoice_id: mongoose.Types.ObjectId;
  mode: 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'INSURANCE';
  amount: number;
  paid_on: Date;
  reference_id: string;
  notes?: string;
}

const InvoicePaymentSchema: Schema = new Schema(
  {
    invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice'},
    mode: { type: String, enum: ['CASH', 'CARD', 'UPI', 'WALLET', 'INSURANCE']},
    amount: { type: Number},
    paid_on: { type: Date},
    reference_id: { type: String},
    notes: { type: String },
  },
  { timestamps: false }
);

export default mongoose.model<IInvoicePayment>('InvoicePayment', InvoicePaymentSchema);
