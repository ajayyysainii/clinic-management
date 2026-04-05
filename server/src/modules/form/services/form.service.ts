import { Form, IForm } from '../models';
import * as invoiceService from '../../billing/patient/services/invoice.service';
import { generatePdfFromHtml, uploadPdfToS3 } from '../../../utils/pdf';
import { ReferralForm, IReferralForm } from '../models/referral.model';
import { Clinic } from '../../clinic/models';

export class FormService {
  async createGstForm(invoiceId: string) {
    // Fetch invoice and related data
    const invoiceData = await invoiceService.getInvoiceById(invoiceId);
    if (!invoiceData) {
      throw new Error('Invoice not found');
    }
    // Destructure nested objects
    const {
      _id,
      invoice_id,
      created_at,
      clinic_id,
      patient_id,
      subtotal,
      tax_amount,
      total_amount,
      amount_due,
      items,
      payments
    } = invoiceData;
    // Use first item and payment if available, cast as any to avoid TS property errors
    const item = (items && items.length > 0 ? items[0] : {}) as any;
    const payment = (payments && payments.length > 0 ? payments[0] : {}) as any;

    // Fetch clinic details
    let clinic: any = {};
    if (clinic_id) {
      const foundClinic = await Clinic.findById(clinic_id).lean();
      clinic = foundClinic || {};
    }

    // Get clinic address from availableLocations
    const clinicAddress = clinic.availableLocations && clinic.availableLocations.length > 0
      ? clinic.availableLocations[0]
      : null;

    // Map fields from nested objects
    const gstFormData = {
      invoice_id: _id,
      invoiceUniqueId: invoice_id,
      invoiceDate: created_at,
      clinicName: clinic.name || '',
      clinicGSTIN: clinic.gstNumber || '',
      patientName: patient_id && typeof patient_id === 'object' && 'name' in patient_id ? (patient_id as any).name : '',
      patientId: patient_id && typeof patient_id === 'object' && '_id' in patient_id ? (patient_id as any)._id.toString() : '',
      serviceDescription: item.name || '',
      hsnOrSacCode: item.hsnOrSacCode || '',
      quantity: item.quantity || 1,
      unitPrice: item.unit_price || subtotal || 0,
      taxableAmount: subtotal || 0,
      gstPercentage: item.gst_rate || 0,
      cgst: (tax_amount || 0) / 2,
      sgst: (tax_amount || 0) / 2,
      totalInvoiceAmount: total_amount || 0,
      paymentMode: payment.mode ? payment.mode.charAt(0).toUpperCase() + payment.mode.slice(1).toLowerCase() : 'Cash',
      outstandingDue: amount_due || 0,
    };
    const gstForm = await Form.create(gstFormData);

    // Generate a styled HTML for GST invoice with clinic header and logo
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>GST Invoice - ${gstForm.invoiceUniqueId}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      <h2>${gstForm.clinicName || 'Clinic Name'}</h2>
      <p>${clinicAddress ? `${clinicAddress.street || ''}, ${clinicAddress.place || ''}, ${clinicAddress.city || ''}, ${clinicAddress.state || ''} - ${clinicAddress.zipCode || ''}` : ''}</p>
      <p>GSTIN: ${gstForm.clinicGSTIN || ''}</p>
      <p>Phone: ${clinic?.phone || ''}</p>
      <p>Email: ${clinic?.email || ''}</p>
    </div>

    <div class="invoice-info">
      <h3>GST Invoice</h3>
      <p>Invoice: ${gstForm.invoiceUniqueId}</p>
      <p>Date: ${new Date(gstForm.invoiceDate).toLocaleDateString('en-GB')}</p>
    </div>

    <div class="logo">
      ${clinic?.logo ? `<img src="${clinic.logo}" alt="Clinic Logo" />` : '<div style="background:#ffffff; padding:10px; border-radius:10px; font-weight:bold; color:#0096F2; text-align:center;"><span style="font-size:1.2rem;">Preva Care</span></div>'}
    </div>
  </div>

  <h1 class="title">GST Invoice</h1>

  <!-- Billing Information -->
  <div class="billing-section">
    <div class="billed-by">
      <h4>Service Provider</h4>
      <p><strong>${gstForm.clinicName || ''}</strong></p>
      <p>${clinicAddress ? `${clinicAddress.street || ''}, ${clinicAddress.place || ''}` : ''}</p>
      <p>${clinicAddress ? `${clinicAddress.city || ''}, ${clinicAddress.state || ''} - ${clinicAddress.zipCode || ''}` : ''}</p>
      <br>
      <p><strong>GSTIN:</strong> ${gstForm.clinicGSTIN || ''}</p>
    </div>
    <div class="billed-to">
      <h4>Patient</h4>
      <p><strong>${gstForm.patientName || ''}</strong></p>

    </div>
  </div>

  <!-- Supply Information -->
  <div class="supply-info">
    <div>
      <strong>Place of Supply:</strong> ${clinicAddress?.city || clinicAddress?.place || 'India'}
    </div>
    <div>
      <strong>Country of Supply:</strong> India
    </div>
  </div>

  <!-- Service Details -->
  <div class="section-container">
    <h4 class="section-title">Service Details</h4>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">Service Description</th>
            <th style="width: 8%;">Qty.</th>
            <th style="width: 12%;">Unit Price</th>
            <th style="width: 12%;">Taxable Amount</th>
            <th style="width: 8%;">GST %</th>
            <th style="width: 9%;">CGST</th>
            <th style="width: 9%;">SGST</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${gstForm.serviceDescription || ''}</td>
            <td>${gstForm.quantity || ''}</td>
            <td>₹${(gstForm.unitPrice || 0).toFixed(2)}</td>
            <td>₹${(gstForm.taxableAmount || 0).toFixed(2)}</td>
            <td>${gstForm.gstPercentage || 0}%</td>
            <td>₹${(gstForm.cgst || 0).toFixed(2)}</td>
            <td>₹${(gstForm.sgst || 0).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Payment Summary -->
  <div class="footer-section">
    <div class="invoice-summary">
      <div class="summary-row">
        <span>Taxable Amount</span>
        <span>₹${(gstForm.taxableAmount || 0).toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>CGST</span>
        <span>₹${(gstForm.cgst || 0).toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>SGST</span>
        <span>₹${(gstForm.sgst || 0).toFixed(2)}</span>
      </div>
      <div class="summary-row total">
        <span>Total Amount</span>
        <span>₹${(gstForm.totalInvoiceAmount || 0).toFixed(2)}</span>
      </div>
    </div>
  </div>

  <div class="amount-words">
    <p><strong>Payment Mode:</strong> ${gstForm.paymentMode || ''}</p>
    <p><strong>Outstanding Due:</strong> ₹${(gstForm.outstandingDue || 0).toFixed(2)}</p>
  </div>
</body>
</html>
`;
    const pdfBuffer = await generatePdfFromHtml(html);
    const pdfUrl = await uploadPdfToS3(pdfBuffer, `GSTInvoice_${gstForm._id}_${Date.now()}.pdf`, 'gst-invoices');
    // Optionally, save the PDF URL in the GST form document
    gstForm.set('gstPdfUrl', pdfUrl);
    await gstForm.save();
    return gstForm;
  }

  async createReferralForm(data: Partial<IReferralForm>) {
    const referralForm = await ReferralForm.create(data);

    // Populate patientId and referredBy for PDF
    const populatedReferralForm = await ReferralForm.findById(referralForm._id)
      .populate('patientId', 'name')
      .populate('referredBy', 'name')
      .exec();
    if (!populatedReferralForm) {
      throw new Error('Referral form not found after creation');
    }
    const patient = populatedReferralForm.patientId as { name?: string };
    const referredBy = populatedReferralForm.referredBy as { name?: string };

    // Fetch clinic information
    const clinic = await Clinic.findById(referralForm.clinicId);
    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Get clinic address from availableLocations
    const clinicAddress = clinic.availableLocations && clinic.availableLocations.length > 0
      ? clinic.availableLocations[0]
      : null;

    // Generate PDF HTML with EMR-inspired styling and clinic header
    const html = `<!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8" />
          <title>Referral Form</title>
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
              flex-direction: row;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 4px solid #0096F2;
              page-break-inside: avoid;
              page-break-after: avoid;
            }
            .header-info-row {
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              width: 100%;
            }
            .doctor-info {
              flex: 1;
            }
            .clinic-info {
              flex: 1;
              text-align: right;
            }
            .doctor-info h2 {
              margin: 0;
              font-weight: 700;
              font-size: 1.2rem;
              word-wrap: break-word;
              color: #333;
            }
            .doctor-info p {
              margin: 0.05rem 0;
              font-size: 0.8rem;
              word-wrap: break-word;
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
              font-size: 1.2rem;
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
              font-size: 0.8rem;
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 0;
              table-layout: fixed;
            }
            th, td {
              padding: 8px 12px;
              text-align: left;
              border-bottom: 1px solid #eee;
              word-wrap: break-word;
              overflow-wrap: break-word;
              vertical-align: top;
            }
            th {
              background-color: #f8f9fa;
              color: #333;
              font-weight: 600;
              width: 25%;
            }
            td {
              width: 75%;
              white-space: pre-wrap;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .vital-signs-table td:first-child {
              font-weight: 500;
              width: 30%;
            }
            .diagnosis-table th {
              text-align: left;
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
            .signature-section {
              margin-top: 2rem;
              padding: 1rem;
              text-align: right;
              page-break-inside: avoid;
            }
            .signature-image {
              max-width: 150px;
              height: auto;
            }
            .multi-col th {
              width: auto;
            }
            .multi-col td {
              width: auto;
            }
            .long-text {
              white-space: pre-wrap;
              word-wrap: break-word;
              max-width: 100%;
            }
            .container-fluid {
              padding: 0 1rem;
            }
            .px-4 {
              padding-left: 1rem;
              padding-right: 1rem;
            }
            .date-section {
              margin-top: 2rem;
              padding: 1rem;
              text-align: right;
              font-size: 0.9rem;
              color: #666;
              border-top: 1px solid #eee;
            }
            .print-specific {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Print-specific styles */
            @media print {
              .header, .footer {
                background-color: #ffffff !important;
                color: #333 !important;
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
                background-color: #f8f9fa !important;
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
              .doctor-info h2 {
                color: #333 !important;
              }
              .doctor-info p {
                color: #666 !important;
              }
              .logo-address {
                color: #666 !important;
              }
            }
          </style>
      </head>
      <body>
          <div class="header">
            <div class="header-info-row">
              <div class="doctor-info">
                <h2>Dr. ${referredBy.name || 'Doctor'}</h2>
                <p>Date: ${referralForm.referralDate ? new Date(referralForm.referralDate).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                <p>Referral Form</p>
              </div>
              <div class="logo">
                ${clinic.logo ? `<img src="${clinic.logo}" alt="Clinic Logo" class="logo">` : ''}
                <div class="logo-address">
                  ${clinic.name || ''}<br>
                  ${clinicAddress ? `${clinicAddress.place}, ${clinicAddress.street}<br>${clinicAddress.city}, ${clinicAddress.state} ${clinicAddress.zipCode}` : ''}
                </div>
              </div>
            </div>
          </div>

          <h1 class="title">REFERRAL FORM</h1>

          <div class="container-fluid px-4">
            <!-- Patient Information -->
            <div class="section-container">
              <h4 class="section-title">Patient Information</h4>
              <div class="table-container">
                <table>
                  <tbody>
                    <tr><th>Patient Name</th><td>${patient.name || '-'}</td></tr>
                    <tr><th>Referred By</th><td>Dr. ${referredBy.name || '-'}</td></tr>
                    <tr><th>Referral Date</th><td>${referralForm.referralDate ? new Date(referralForm.referralDate).toLocaleDateString() : '-'}</td></tr>
                    <tr><th>Clinic</th><td>${clinic.name || '-'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

                      <!-- Referral Details -->
            <div class="section-container">
              <h4 class="section-title">Referral Details</h4>
              <div class="table-container">
                <table>
                  <tbody>
                    <tr><th>Referred To</th><td>${data.referredTo?.name || (referralForm.referredTo && referralForm.referredTo.name) || '-'}</td></tr>
                    <tr><th>Department</th><td>${data.referredTo?.department || (referralForm.referredTo && referralForm.referredTo.department) || '-'}</td></tr>
                    <tr><th>Hospital/Clinic</th><td>${data.referredTo?.hospital || (referralForm.referredTo && referralForm.referredTo.hospital) || '-'}</td></tr>
                    <tr><th>Contact Information</th><td>${data.referredTo?.contact || (referralForm.referredTo && referralForm.referredTo.contact) || '-'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

                      <!-- Medical Information -->
            <div class="section-container">
              <h4 class="section-title">Medical Information</h4>
              <div class="table-container">
                <table>
                  <tbody>
                    <tr><th>Reason for Referral</th><td class="long-text">${data.reasonForReferral || referralForm.reasonForReferral || '-'}</td></tr>
                    <tr><th>Provisional Diagnosis</th><td class="long-text">${data.provisionalDiagnosis || referralForm.provisionalDiagnosis || '-'}</td></tr>
                    <tr><th>Medical History</th><td class="long-text">${data.medicalHistory || referralForm.medicalHistory || '-'}</td></tr>
                    <tr><th>Investigations Done</th><td class="long-text">${(data.investigationsDone || referralForm.investigationsDone || []).join(', ') || '-'}</td></tr>
                    <tr><th>Attachments</th><td class="long-text">${(data.attachments || referralForm.attachments || []).join(', ') || '-'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

                      <!-- Instructions and Follow-up -->
            <div class="section-container">
              <h4 class="section-title">Instructions & Follow-up</h4>
              <div class="table-container">
                <table>
                  <tbody>
                    <tr><th>Instructions</th><td class="long-text">${data.instructions || referralForm.instructions || '-'}</td></tr>
                    <tr><th>Referral Date</th><td>${referralForm.referralDate ? new Date(referralForm.referralDate).toLocaleDateString() : '-'}</td></tr>
                    <tr><th>Created Date</th><td>${referralForm.createdAt ? new Date(referralForm.createdAt).toLocaleDateString() : '-'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>


          </div>

          <div class="footer">
            <span>2025 Preva Care | Referral Form Management System</span>
          </div>
      </body>
      </html>`;
    const { generatePdfFromHtml, uploadPdfToS3 } = await import('../../../utils/pdf');
    const pdfBuffer = await generatePdfFromHtml(html);
    const pdfUrl = await uploadPdfToS3(pdfBuffer, `ReferralForm_${referralForm._id}_${Date.now()}.pdf`, 'referral-forms');
    referralForm.set('pdfUrl', pdfUrl);
    await referralForm.save();
    return referralForm;
  }

  async getReferralForms(filter: any = {}) {
    return ReferralForm.find(filter).sort({ referralDate: -1 });
  }

  async getReferralFormById(id: string) {
    return ReferralForm.findById(id);
  }

  async updateReferralForm(id: string, data: Partial<IReferralForm>) {
    return ReferralForm.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteReferralForm(id: string) {
    return ReferralForm.findByIdAndDelete(id);
  }

  async getReferralFormsByDoctor(doctorId: string) {
    return ReferralForm.find({
      $or: [
        { referredBy: doctorId },
        { 'referredTo.doctorId': doctorId }
      ]
    })
      .populate('patientId', 'name email')
      .populate('referredBy', 'name email')
      .populate('referredTo.doctorId', 'name email')
      .sort({ referralDate: -1 });
  }

  async getReferralFormsByPatient(patientId: string) {
    return ReferralForm.find({ patientId })
      .populate('patientId', 'name email')
      .populate('referredBy', 'name email')
      .populate('referredTo.doctorId', 'name email')
      .sort({ referralDate: -1 });
  }

  async getReferralFormsByClinic(clinicId: string) {
    return ReferralForm.find({ clinicId })
      .populate('patientId', 'name email')
      .populate('referredBy', 'name email')
      .populate('referredTo.doctorId', 'name email')
      .sort({ referralDate: -1 });
  }
}
