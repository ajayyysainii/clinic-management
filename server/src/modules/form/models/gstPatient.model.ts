import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientGstInvoice extends Document {
  invoice_id: mongoose.Types.ObjectId;
  invoiceUniqueId: string;
  invoiceDate: Date;
  clinicName: string;
  clinicGSTIN: string;
  patientName: string;
  patientId: string;
  serviceDescription: string;
  hsnOrSacCode: string;
  quantity: number;
  unitPrice: number;
  taxableAmount: number;
  gstPercentage: number;
  cgst: number;
  sgst: number;
  totalInvoiceAmount: number;
  paymentMode: 'Cash'|'UPI'|'Card'|'Wallet'|'Insurance';
  outstandingDue: number;
  gstPdfUrl?: string;
}

const PatientGstInvoiceSchema: Schema = new Schema<IPatientGstInvoice>({
  invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  invoiceUniqueId: { type: String, unique: true },
  invoiceDate: { type: Date,  },
  clinicName: { type: String },
  clinicGSTIN: { type: String },
  patientName: { type: String},
  patientId: { type: String},
  serviceDescription: { type: String},
  hsnOrSacCode: { type: String},
  quantity: { type: Number},
  unitPrice: { type: Number },
  taxableAmount: { type: Number},
  gstPercentage: { type: Number},
  cgst: { type: Number },
  sgst: { type: Number},
  totalInvoiceAmount: { type: Number},
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Wallet','Insurance'] },
  outstandingDue: { type: Number, default: 0 },
  gstPdfUrl: { type: String },
}, {
  timestamps: true,
});

export default mongoose.model<IPatientGstInvoice>('PatientGstInvoice', PatientGstInvoiceSchema);
export const Form = mongoose.model<IPatientGstInvoice>('PatientGstInvoice', PatientGstInvoiceSchema);
export type IForm = IPatientGstInvoice;
