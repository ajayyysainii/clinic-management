import mongoose, { Types } from 'mongoose';
import Invoice, { IInvoice } from '../models/invoice.model';
import InvoicePayment, { IInvoicePayment } from '../models/invoicePayment.model';
import InvoiceDiscount, { IInvoiceDiscount } from '../models/invoiceDiscount.model';
import InvoiceRefund, { IInvoiceRefund } from '../models/invoiceRefund.model';
import { InvoiceItem, IInvoiceItem } from '../models/invoiceItem.model';
import { FilterQuery } from 'mongoose';
import path from 'path';
import fs from 'fs';
import { GstClinicInvoice } from '../../../form/models/gstClinic.model';
import { User } from '../../../user/models'
import Clinic from '../../../clinic/models/clinic.model';
import PatientGstInvoice from '../../../form/models/gstPatient.model';
import { Inventory } from '../../../inventory/models';
import { PatientVisitDoctors, Status } from '../../../patient/models';
import WhatsAppService from '../../../../utils/whatsappService';
import { ClinicPatient } from '../../../patient/models';
import { PDFGenerator } from '../../../../utils/pdfGenerator';

interface CreateInvoicePayload {
  invoice: Partial<IInvoice>;
  payments?: Partial<IInvoicePayment>[];
  discounts?: Partial<IInvoiceDiscount>[];
  refunds?: Partial<IInvoiceRefund>[];
  items?: Partial<IInvoiceItem>[];
}



function formatCurrency(amt: number | string | undefined): string {
  return `₹${Number(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}
function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Helper to generate invoice HTML (comprehensive version)
function generateInvoiceHTML(
  invoice: any,
  items: any[] = [],
  payments: any[] = [],
  discounts: any[] = [],
  refunds: any[] = [],
  clinic: any = {},
  patient: any = {}
) {
  // Clinic address
  const loc = (clinic?.availableLocations && clinic.availableLocations[0]) || {};
  const clinicAddress = [loc?.street, loc?.place, loc?.city, loc?.state, loc?.zipCode].filter(Boolean).join(', ');

  // Patient address (if available)
  const patientAddress = patient?.address || '';

  // GSTIN, PAN (if available)
  const clinicGSTIN = clinic?.gstNumber || '';
  const clinicPAN = clinic?.panNumber || '';
  const patientGSTIN = patient?.gstin || '';
  const patientPAN = patient?.pan || '';

  // Bank details (if available)
  const bank = clinic?.bankDetails || {};

  // Place of supply
  const placeOfSupply = loc?.city || loc?.place || '';

  // Invoice fields
  const invoiceNumber = invoice?.invoice_id || '';
  const invoiceDate = formatDate(invoice?.created_at);
  const dueDate = formatDate(invoice?.due_date);

  // Items table rows
  const itemsRows = items.map((item, idx) => `
    <tr>
      <td>${idx + 1}. ${item?.name || ''}</td>
      <td>${item?.quantity || ''}</td>
      <td>${item?.gst_rate || ''}%</td>
      <td>${formatCurrency(item?.unit_price * item?.quantity)}</td>
      <td>${formatCurrency(item?.total_amount)}</td>
    </tr>
  `).join('');

  // Discount summary
  const discountRow = invoice?.discount ? `<div class="summary-row discount"><span>Discount</span><span>- ${formatCurrency(invoice.discount)}</span></div>` : '';

  // Payments summary (optional)
  const paymentRows = payments.map((p, idx) => {
    const referenceId = p?.reference_id ? ` - Ref: ${p.reference_id}` : '';
    return `<div class="payment-row"><span>Payment #${idx + 1} (${p?.mode || ''}${referenceId}):</span> <span>${formatCurrency(p?.amount)}</span></div>`;
  }).join('');

  // Amount in words
  const amountWords = invoice.amount_word;

  // Use clinic logo if available, otherwise use default
  const logoHtml = clinic?.logo
    ? `<img src="${clinic.logo}" alt="${clinic.name || 'Clinic'} Logo" style="max-height:40px; background-color:#ffffff; padding:10px; border-radius:10px;" />`
    : `<div style="background:#0096F2; color:white; padding:10px; border-radius:10px; font-weight:bold; text-align:center;">
       <span style="font-size:1.2rem;">${clinic?.name || 'Preva Care'}</span>
     </div>`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice #${invoiceNumber}</title>
    <style>
      @page {
        size: A4;
        margin: 15mm;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        margin: 0;
        padding: 0;
        color: #333;
        line-height: 1.6;
        font-size: 12px;
      }
      .header {
        background: #ffffff;
        padding: 1.5rem;
        color: #333;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 4px solid #0096F2;
        page-break-inside: avoid;
        page-break-after: avoid;
      }
      .clinic-info {
        flex: 1;
      }
      .clinic-info h2 {
        margin: 0;
        font-weight: 700;
        font-size: 1.4rem;
        word-wrap: break-word;
        color: #333;
      }
      .clinic-info p {
        margin: 0.05rem 0;
        font-size: 0.9rem;
        word-wrap: break-word;
        color: #666;
      }
      .invoice-info {
        flex: 1;
        text-align: center;
      }
      .invoice-info h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        color: #0096F2;
      }
      .invoice-info p {
        margin: 0.05rem 0;
        font-size: 0.8rem;
        color: #666;
      }
      .logo {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        min-width: 120px;
        margin-left: 1rem;
      }
      .logo img {
        max-height: 46px;
        object-fit: contain;
        background-color: #ffffff;
        padding: 10px;
        border-radius: 10px;
      }
      .logo-address {
        font-size: 0.7rem;
        color: #666;
        text-align: right;
        margin-top: 0.5rem;
        max-width: 200px;
        word-wrap: break-word;
      }
      .title {
        text-align: center;
        margin: 1.5rem 0;
        font-size: 1.4rem;
        font-weight: 700;
        color: #0096F2;
        text-transform: uppercase;
        page-break-after: avoid;
        word-wrap: break-word;
      }
      .section-title {
        background-color: #0096F2;
        color: white;
        padding: 8px 12px;
        font-weight: 600;
        font-size: 0.9rem;
        margin-bottom: 0;
        border-radius: 4px 4px 0 0;
        page-break-after: avoid;
        word-wrap: break-word;
      }
      .section-container {
        page-break-inside: avoid;
        margin-bottom: 1.5rem;
      }
      .table-container {
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-radius: 0 0 4px 4px;
        page-break-inside: avoid;
        overflow: hidden;
      }
      .billing-section {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        gap: 2rem;
      }
      .billed-by, .billed-to {
        flex: 1;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
        border-left: 4px solid #0096F2;
      }
      .billed-by h4, .billed-to h4 {
        color: #0096F2;
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
      }
      .billed-by p, .billed-to p {
        margin: 0.2rem 0;
        font-size: 0.85rem;
        word-wrap: break-word;
      }
      .supply-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding: 0.8rem;
        background: #f0f9ff;
        border-radius: 4px;
        border: 1px solid #0096F2;
      }
      .supply-info div {
        font-size: 0.85rem;
        font-weight: 500;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 0;
        table-layout: fixed;
      }
      th, td {
        padding: 10px 8px;
        text-align: left;
        border-bottom: 1px solid #eee;
        word-wrap: break-word;
        overflow-wrap: break-word;
        vertical-align: top;
      }
      th {
        background-color: #0096F2;
        color: white;
        font-weight: 600;
        font-size: 0.85rem;
      }
      td {
        white-space: pre-wrap;
        font-size: 0.85rem;
      }
      tr:last-child td {
        border-bottom: none;
      }
      tbody tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .footer-section {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
        margin-top: 2rem;
      }
      .invoice-summary {
        flex: 1;
        max-width: 400px;
        margin-left: auto;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 12px;
        border-bottom: 1px solid #f0f0f0;
        font-size: 0.9rem;
      }
      .summary-row.discount {
        color: #22c55e;
      }
      .summary-row.total {
        border-top: 2px solid #0096F2;
        border-bottom: 2px solid #0096F2;
        font-size: 1.1rem;
        font-weight: 700;
        margin-top: 8px;
        padding: 10px 12px;
        background-color: #f8f9fa;
      }
      .amount-words {
        margin: 1rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-left: 4px solid #0096F2;
        border-radius: 4px;
      }
      .amount-words p {
        margin: 0.3rem 0;
        font-size: 0.85rem;
      }
      .payment-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 12px;
        font-size: 0.8rem;
        color: #22c55e;
        border-bottom: 1px solid #f0f0f0;
      }
      .bottom-section {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
        border-top: 2px solid #e0e0e0;
        padding-top: 1.5rem;
        margin-top: 2rem;
      }
      .terms, .additional-notes {
        flex: 1;
      }
      .terms h4, .additional-notes h4 {
        color: #0096F2;
        margin-bottom: 0.8rem;
        font-size: 1rem;
      }
      .terms ol {
        padding-left: 1.2rem;
      }
      .terms li, .additional-notes p {
        margin: 0.5rem 0;
        font-size: 0.8rem;
        line-height: 1.5;
      }
      .footer {
        background: #0096F2;
        color: white;
        text-align: center;
        padding: 0.8rem 0;
        font-size: 0.9rem;
        margin-top: 2rem;
        border-radius: 4px;
        page-break-inside: avoid;
        page-break-before: auto;
        word-wrap: break-word;
      }

      /* Print-specific styles */
      @media print {
        .header, .footer {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .section-title {
          background-color: #0096F2 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        th {
          background-color: #0096F2 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .section-container {
          break-inside: avoid;
        }
        h4 {
          break-after: avoid;
        }
        table {
          break-inside: avoid;
        }
        tr {
          break-inside: avoid;
        }
        td, th {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .summary-row.total {
          background-color: #f8f9fa !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .footer {
          background-color: #0096F2 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="clinic-info">
        <h2>${clinic.name || 'Clinic Name'}</h2>
        <p>${clinicAddress}</p>
        <p>GSTIN: ${clinicGSTIN}</p>
        <p>PAN: ${clinicPAN}</p>
        <p>Phone: ${clinic.phone || ''}</p>
        <p>Email: ${clinic.email || ''}</p>
      </div>

      <div class="logo">
        ${logoHtml}
      </div>
    </div>

    <h1 class="title">Invoice</h1>

    <!-- Billing Information -->
    <div class="billing-section">
      <div class="billed-by">
        <h4>Billed by</h4>
        <p><strong>${clinic.name || ''}</strong></p>
        <p>${clinicAddress}</p>
        <br>
        <p><strong>GSTIN:</strong> ${clinicGSTIN}</p>
        <p><strong>PAN:</strong> ${clinicPAN}</p>
      </div>
      <div class="billed-to">
        <h4>Billed to</h4>
        <p><strong>${patient.name || ''}</strong></p>
        <p>${patientAddress}</p>
        <br>
        ${patientGSTIN ? `<p><strong>GSTIN:</strong> ${patientGSTIN}</p>` : ''}
        ${patientPAN ? `<p><strong>PAN:</strong> ${patientPAN}</p>` : ''}
      </div>
    </div>

    <!-- Supply Information -->
    <div class="supply-info">
      <div>
        <strong>Place of Supply:</strong> ${placeOfSupply}
      </div>
      <div>
        <strong>Country of Supply:</strong> India
      </div>
    </div>

    <!-- Items -->
    <div class="section-container">
      <h4 class="section-title">Invoice Items</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 30%;">Item Description</th>
              <th style="width: 10%;">Qty.</th>
              <th style="width: 10%;">GST</th>
              <th style="width: 15%;">Taxable Amount</th>
              <th style="width: 15%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer Section -->
    <div class="footer-section">
      <!-- Invoice Summary -->
      <div class="invoice-summary">
        <div class="summary-row">
          <span>Sub Total</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${discountRow}
        <div class="summary-row">
          <span>Taxable Amount</span>
          <span>${formatCurrency(invoice.subtotal - (invoice.discount || 0))}</span>
        </div>
        <div class="summary-row">
          <span>CGST</span>
          <span>${formatCurrency((invoice.tax_amount || 0) / 2)}</span>
        </div>
        <div class="summary-row">
          <span>SGST</span>
          <span>${formatCurrency((invoice.tax_amount || 0) / 2)}</span>
        </div>
        <div class="summary-row total">
          <span><strong>Total</strong></span>
          <span><strong>${formatCurrency(invoice.total_amount)}</strong></span>
        </div>
        <div class="amount-words">
          <p><strong>Invoice Total (in words)</strong></p>
          <p>${amountWords}</p>
        </div>
        ${paymentRows ? `<div style="margin-top: 1rem; padding: 0.5rem; background: #f0f9ff; border-radius: 4px;"><strong>Payments Received:</strong>${paymentRows}</div>` : ''}
      </div>
    </div>

    <!-- Terms and Additional Notes -->
    <div class="bottom-section">
      <div class="terms">
        <h4>Terms and Conditions</h4>
        <ol>
          <li>Please pay within 15 days from the date of invoice, overdue interest @ 24% will be charged on delayed payments.</li>
          <li>Please quote invoice number when remitting funds.</li>
          <li>All disputes subject to local jurisdiction only.</li>
        </ol>
      </div>
      <div class="additional-notes">
        <h4>Additional Notes</h4>
        <p>Thank you for choosing our services. For any enquiries, please contact us:</p>
        <p><strong>Email:</strong> ${clinic.email || ''}</p>
        <p><strong>Phone:</strong> ${clinic.phone || ''}</p>
      </div>
    </div>

    <div class="footer">
      <p>This is a computer-generated invoice and does not require a signature.</p>
      <p>© 2025 Preva Care - All rights reserved</p>
    </div>
  </body>
</html>`;
}

// Update generateInvoicePDF to accept all arrays and clinic/patient
async function generateInvoicePDF(
  invoice: any,
  items: any[],
  payments: any[] = [],
  discounts: any[] = [],
  refunds: any[] = [],
  clinic: any = {},
  patient: any = {}
): Promise<string> {
  const html = generateInvoiceHTML(invoice, items, payments, discounts, refunds, clinic, patient);
  const fileName = `Invoice_${invoice._id || invoice.invoice_id}_${Date.now()}.pdf`;

  const pdfUrl = await PDFGenerator.generatePDF(html, fileName, {
    headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;"></div>`,
    footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
    </div>`,
  });

  return pdfUrl;
}



export const createInvoice = async (data: CreateInvoicePayload) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Create Invoice
    const invoiceDoc = await Invoice.create([data.invoice], { session });
    const invoice = invoiceDoc[0] as IInvoice;
    const invoiceId = (invoice._id as Types.ObjectId).toString();

    // Create Invoice Items if any
    let items: IInvoiceItem[] = [];
    if (data.items && data.items.length > 0) {
      const itemsWithInvoice = data.items.map((item) => ({ ...item, invoice_id: invoiceId }));
      items = await InvoiceItem.insertMany(itemsWithInvoice, { session });
    }

    // Create Payments if any
    let payments: IInvoicePayment[] = [];
    if (data.payments && data.payments.length > 0) {
      const paymentsWithInvoice = data.payments.map((p) => ({ ...p, invoice_id: invoiceId }));
      payments = await InvoicePayment.insertMany(paymentsWithInvoice, { session });
    }

    // Create Discounts if any
    let discounts: IInvoiceDiscount[] = [];
    if (data.discounts && data.discounts.length > 0) {
      const discountsWithInvoice = data.discounts.map((d) => ({ ...d, invoice_id: invoiceId }));
      discounts = await InvoiceDiscount.insertMany(discountsWithInvoice, { session });
    }

    // Create Refunds if any
    let refunds: IInvoiceRefund[] = [];
    if (data.refunds && data.refunds.length > 0) {
      const refundsWithInvoice = data.refunds.map((r) => ({ ...r, invoice_id: invoiceId }));
      refunds = await InvoiceRefund.insertMany(refundsWithInvoice, { session });
    }

    // Fetch patient and clinic objects, ensure not null
    let patient: any = {};
    if (invoice.patient_id) {
      const foundPatient = await User.findById(invoice.patient_id).lean();
      patient = foundPatient || {};
    }
    let clinic: any = {};
    if (invoice.clinic_id) {
      const foundClinic = await Clinic.findById(invoice.clinic_id).lean();
      clinic = foundClinic || {};
    }

    // Update inventory stock for consumable items
    const consumableItems = items.filter(item => item.type === 'CONSUMABLE' && item.inventoryItemId);
    if (consumableItems.length > 0) {
      for (const item of consumableItems) {
        try {
          const inventoryItem = await Inventory.findById(item.inventoryItemId);
          if (inventoryItem) {
            const newQuantity = Math.max(0, inventoryItem.quantity - item.quantity);
            await Inventory.findByIdAndUpdate(
              item.inventoryItemId,
              { quantity: newQuantity },
              { session }
            );
          }
        } catch (error) {
          console.error(`Failed to update inventory for item ${item.inventoryItemId}:`, error);
          // Continue with other items even if one fails
        }
      }
    }

    // Create GST Clinic Invoice
    const gstClinicData = {
      invoice_id: invoice._id,
      invoiceNumber: invoice.invoice_id,
      invoiceDate: invoice.created_at,
      customerName: patient?.name || '',
      hsnOrSacCode: items[0]?.name || '', // Or use a specific field if available
      taxableValue: invoice.subtotal || 0,
      cgst: (invoice.tax_amount || 0) / 2,
      sgst: (invoice.tax_amount || 0) / 2,
      totalGst: invoice.tax_amount || 0,
      placeOfSupply: (clinic.availableLocations && clinic.availableLocations[0]?.city) || '',
    };
    await GstClinicInvoice.create([gstClinicData], { session });

    // Generate PDF and upload to S3 (pass all arrays and clinic/patient)
    const pdfUrl = await generateInvoicePDF(invoice, items, payments, discounts, refunds, clinic, patient);
    invoice.invoicePdfUrl = pdfUrl;
    await invoice.save({ session });

    // Send WhatsApp message with invoice PDF
    try {
      const whatsappService = new WhatsAppService();
      const patientName = patient?.name || 'Patient';
      const clinicName = clinic?.name || 'Clinic';
      const invoiceNumber = invoice.invoice_id || '';
      const totalAmount = invoice.total_amount || 0;
      const patientPhoneNumber = patient?.phone;

      if (patientPhoneNumber) {
        await whatsappService.sendInvoicePdfLink(
          patientName,
          clinicName,
          invoiceNumber,
          totalAmount,
          pdfUrl,
          patientPhoneNumber
        );
        console.log('✅ WhatsApp invoice PDF message sent successfully to:', patientPhoneNumber);
      } else {
        console.log('⚠️ No patient phone number available for WhatsApp notification');
      }
    } catch (whatsappError) {
      console.error('❌ Error sending WhatsApp invoice PDF message:', whatsappError);
      // Don't fail the invoice creation if WhatsApp fails
    }

    // Mark appointment as completed if appointment_id is provided
    if (invoice.appointment_id) {
      try {
        await PatientVisitDoctors.findByIdAndUpdate(
          invoice.appointment_id,
          { status: Status.COMPLETED },
          { session }
        );
      } catch (error) {
        console.error('Failed to mark appointment as completed:', error);
        // Continue with invoice creation even if appointment update fails
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Create daily earning record after transaction is committed
    try {
      if (invoice.appointment_id) {
        const appointment = await PatientVisitDoctors.findById(invoice.appointment_id);
        if (appointment) {
          const clinicPatient = await ClinicPatient.findById(appointment.clinicPatientId);
          if (clinicPatient) {
            const { DoctorPayoutConfig } = await import('../../doctor/models/doctorPayoutConfig.model');
            const existingConfig = await DoctorPayoutConfig.findOne({
              doctor_id: appointment.doctorId,
              clinic_id: clinicPatient.clinicId,
            });

            if (existingConfig) {
              const result = await DoctorPayoutConfig.findOneAndUpdate(
                {
                  doctor_id: appointment.doctorId,
                  clinic_id: clinicPatient.clinicId,
                },
                {
                  $push: { invoice_ids: invoice._id }
                },
                { upsert: false, new: true }
              );
              console.log('✅ Invoice added to payout config:', result ? 'Success' : 'Failed');

              // Note: Doctor earnings are now handled by the daily earning service
              console.log('💰 Doctor earnings will be calculated by daily earning service');

              // Create daily earning record
              console.log('🔄 About to create daily earning record...');
              console.log('📋 Invoice details:', {
                id: invoice._id,
                subtotal: invoice.subtotal,
                appointment_id: invoice.appointment_id,
                created_at: invoice.created_at
              });
              console.log('👨‍⚕️ Doctor details:', {
                doctorId: appointment.doctorId,
                clinicId: clinicPatient.clinicId
              });

              const { DoctorDailyEarningService } = await import('../../doctor/services/doctorDailyEarning.service');
              console.log('📦 DoctorDailyEarningService imported successfully');
              const dailyEarningService = new DoctorDailyEarningService();
              console.log('🔧 DailyEarningService instance created');

              console.log('📞 Calling createDailyEarningRecord with params:', {
                doctorId: appointment.doctorId,
                clinicId: clinicPatient.clinicId,
                invoiceId: invoice._id
              });

              const dailyEarningResult = await dailyEarningService.createDailyEarningRecord(
                appointment.doctorId,
                clinicPatient.clinicId,
                invoice._id as any
              );

              if (dailyEarningResult) {
                console.log('💰 Daily earning record created successfully:', {
                  id: dailyEarningResult._id,
                  doctor_id: dailyEarningResult.doctor_id,
                  clinic_id: dailyEarningResult.clinic_id,
                  invoice_id: dailyEarningResult.invoice_id,
                  commission_amount: dailyEarningResult.commission_amount
                });
              } else {
                console.log('❌ Daily earning record creation failed or returned null');
                console.log('🔍 This could mean:');
                console.log('   - No payout config found for the doctor/clinic');
                console.log('   - Model validation failed');
                console.log('   - Database connection issue');
                console.log('   - Model not registered with Mongoose');
              }
            } else {
              console.log('⚠️ No payout config found for doctor:', appointment.doctorId, 'clinic:', clinicPatient.clinicId);
            }
          } else {
            console.log('❌ Clinic patient not found for appointment:', appointment._id);
          }
        } else {
          console.log('❌ Appointment not found for ID:', invoice.appointment_id);
        }
      } else {
        console.log('⚠️ Invoice has no appointment_id');
      }
    } catch (error) {
      console.error('❌ Failed to create daily earning record:', error);
      // Continue even if this fails - invoice was already created successfully
    }

    return { invoice, items: items as any[], payments: payments as any[], discounts: discounts as any[], refunds: refunds as any[] };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const createInvoiceWithPayment = async (data: CreateInvoicePayload, paymentMethod: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // If payment method is CASH, create invoice directly
    if (paymentMethod === 'CASH') {
      return await createInvoice(data);
    }

    // For other payment methods, create invoice with pending status
    const invoiceData = {
      ...data,
      invoice: {
        ...data.invoice,
        status: 'UNPAID' as const, // Set as unpaid initially
      }
    };

    const result = await createInvoice(invoiceData);

    // Note: The appointment will be marked as completed in the createInvoice function
    // when the invoice is successfully created

    await session.commitTransaction();
    session.endSession();

    return {
      ...result,
      requiresPayment: true,
      paymentMethod
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const updateInvoiceAfterPayment = async (invoiceId: string, paymentData: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update invoice status to PAID
    await Invoice.findByIdAndUpdate(
      invoiceId,
      {
        status: 'PAID',
        amount_paid: paymentData.amount,
        amount_due: 0
      },
      { session }
    );

    // Add payment record
    const paymentRecord = {
      invoice_id: invoiceId,
      mode: paymentData.method || 'CARD',
      amount: paymentData.amount,
      paid_on: new Date(),
      reference_id: paymentData.payment_id,
      notes: `Payment processed via ${paymentData.method || 'Razorpay'}`
    };

    await InvoicePayment.create([paymentRecord], { session });

    await session.commitTransaction();
    session.endSession();

    return { success: true, message: 'Invoice updated successfully after payment' };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const addPaymentRecord = async (paymentData: any) => {
  try {
    const paymentRecord = await InvoicePayment.create([paymentData]);
    return paymentRecord[0];
  } catch (error) {
    throw error;
  }
};

export const getInvoiceById = async (id: string) => {
  const invoice = await Invoice.findById(id)
    .populate("clinic_id")
    .populate("patient_id")
    .populate("appointment_id")


  if (!invoice) {
    return null;
  }

  // Get all related data for this invoice
  const [items, payments, discounts, refunds] = await Promise.all([
    InvoiceItem.find({ invoice_id: invoice._id }),
    InvoicePayment.find({ invoice_id: invoice._id }),
    InvoiceDiscount.find({ invoice_id: invoice._id }),
    InvoiceRefund.find({ invoice_id: invoice._id })
  ]);

  // Return invoice with all related data
  return {
    ...invoice.toObject(),
    items,
    payments,
    discounts,
    refunds
  };
};

export const updateInvoice = async (id: string, data: Partial<IInvoice>) => {
  return Invoice.findByIdAndUpdate(id, data, { new: true });
};

export const deleteInvoice = async (id: string) => {
  return Invoice.findByIdAndDelete(id);
};

export const listInvoices = async (query: FilterQuery<IInvoice>) => {
  return Invoice.find(query);
};

export const getInvoicesByClinicId = async (clinicId: Types.ObjectId) => {
  if (!mongoose.Types.ObjectId.isValid(clinicId)) {
    throw new Error('Invalid clinic ID format')
  }
  // Populate patient_id with name
  const invoices = await Invoice.find({ clinic_id: clinicId }).populate('patient_id');
  // For each invoice, check if GST invoice exists
  const invoiceIds = invoices.map(inv => inv._id);
  const gstInvoices = await PatientGstInvoice.find({ invoice_id: { $in: invoiceIds } });
  const gstInvoiceMap = new Map();
  gstInvoices.forEach(gst => {
    gstInvoiceMap.set(String(gst.invoice_id), gst);
  });
  // Attach gstInvoice info to each invoice
  const invoicesWithGst = invoices.map(inv => {
    const gst = gstInvoiceMap.get(String(inv._id));
    return {
      ...inv.toObject(),
      gstInvoice: gst ? { exists: true, pdfUrl: gst.gstPdfUrl } : { exists: false }
    };
  });
  return invoicesWithGst;
};

