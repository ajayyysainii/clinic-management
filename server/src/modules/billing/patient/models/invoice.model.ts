import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IInvoice extends Document {
  invoice_id: string; // Unique invoice ID
  appointment_id: mongoose.Types.ObjectId;
  patient_id: mongoose.Types.ObjectId;
  clinic_id: mongoose.Types.ObjectId;
  subtotal: number;
  discount?: number;
  tax_amount: number;
  total_amount: number;
  amount_word: string;
  amount_paid: number;
  amount_due: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'REFUNDED';
  created_at: Date;
  updated_at: Date;
  invoicePdfUrl?: string; // S3 link to the generated PDF
}

const InvoiceSchema: Schema = new Schema(
  {
    invoice_id: { type: String, unique: true},
    appointment_id: { type: Schema.Types.ObjectId, ref: 'PatientVisitDoctors' },
    patient_id: { type: Schema.Types.ObjectId, ref: 'User'},
    clinic_id: { type: Schema.Types.ObjectId, ref: 'Clinic'},
    subtotal: { type: Number},
    discount: { type: Number },
    tax_amount: { type: Number,},
    total_amount: { type: Number,},
    amount_word: { type: String,},
    amount_paid: { type: Number,},
    amount_due: { type: Number,},
    status: { type: String, enum: ['PAID', 'PARTIAL', 'UNPAID', 'REFUNDED'] },
    invoicePdfUrl: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Pre-save hook to generate unique invoice_id
InvoiceSchema.pre('save', function (next) {
  if (!this.invoice_id) {
    const randomStr = crypto.randomBytes(6).toString('hex');
    this.invoice_id = `INVOICE-${randomStr}`;
  }
  next();
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
