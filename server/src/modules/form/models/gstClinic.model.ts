import mongoose, { Schema, Document } from 'mongoose';

export interface IGstClinicInvoice extends Document {
  invoice_id: mongoose.Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  hsnOrSacCode: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  placeOfSupply: string;
}

const GstClinicInvoiceSchema: Schema = new Schema<IGstClinicInvoice>({
  invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  invoiceNumber: { type: String},
  invoiceDate: { type: Date},
  customerName: { type: String},
  hsnOrSacCode: { type: String},
  taxableValue: { type: Number},
  cgst: { type: Number},
  sgst: { type: Number},
  totalGst: { type: Number},
  placeOfSupply: { type: String},
}, {
  timestamps: true,
});

export default mongoose.model<IGstClinicInvoice>('GstClinicInvoice', GstClinicInvoiceSchema);
export const GstClinicInvoice = mongoose.model<IGstClinicInvoice>('GstClinicInvoice', GstClinicInvoiceSchema);
export type IGstClinicInvoiceModel = IGstClinicInvoice;
