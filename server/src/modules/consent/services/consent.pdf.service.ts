import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import dayjs from 'dayjs';
import { IConsentForm } from '../models/consent.model';
import s3Client from '../../../utils/s3Client';
import { PutObjectCommand } from '@aws-sdk/client-s3';

class ConsentPDFService {
  private generateHTML(formData: IConsentForm, doctorMeta: any): string {
    const formatDate = (date: any) => date ? dayjs(date).format('DD/MM/YYYY, h:mm A') : 'N/A';

    // Cast populated fields to access their properties
    const patient = formData.patientId as any;
    const doctor = formData.doctorId as any;
    const clinic = formData.clinicId as any;

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8" />
          <title>Consent Form - ${formData.procedureName}</title>
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
              font-size: 1.5rem;
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
            .signature-section {
              margin-top: 2rem;
              padding: 1rem;
              text-align: right;
              page-break-inside: avoid;
            }
            .signature-image {
              max-width: 150px;
              height: auto;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .signature-info {
              margin-top: 0.5rem;
              font-size: 0.8rem;
              color: #666;
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
            .important-notice {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 4px;
              padding: 1rem;
              margin: 1rem 0;
              color: #856404;
            }
            .important-notice h4 {
              margin: 0 0 0.5rem 0;
              color: #856404;
            }
            .important-notice p {
              margin: 0.25rem 0;
              font-size: 0.8rem;
            }
            .print-specific {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .signatures-container {
              display: flex;
              justify-content: center;
              margin: 1rem 0;
            }
            .signature-box {
              flex: 1;
              text-align: center;
              padding: 1rem;
              border: 1px solid #ddd;
              border-radius: 4px;
              background-color: #f9f9f9;
            }
            .signature-box h5 {
              margin: 0 0 1rem 0;
              color: #0096F2;
              font-size: 0.9rem;
              font-weight: 600;
            }
            .signature-content {
              margin-top: 1rem;
            }
            .signature-image {
              max-width: 120px;
              height: auto;
              border: 1px solid #ddd;
              border-radius: 4px;
              margin: 0 auto 0.5rem auto;
              display: block;
            }
            .signature-info {
              margin-top: 0.5rem;
              font-size: 0.8rem;
              color: #666;
              text-align: center;
            }
          </style>
      </head>
      <body>
          <div class="header">
            <div class="header-info-row">
              <div class="doctor-info">
                <h2>Dr. ${doctor?.name || 'N/A'}</h2>
                <p>Date: ${formatDate(formData.consentDate)}</p>
              </div>
            </div>
            <div class="logo">
              <img src="${clinic?.logo || 'https://prevacare-clinic.s3.amazonaws.com/default-logo.png'}" alt="Clinic Logo" class="signature-image" />
              <div class="logo-address">${clinic?.address || clinic?.name || 'Preva Care Clinic'}</div>
            </div>
          </div>

                    <h1 class="title">Informed Consent Form</h1>



          <div class="section-container">
            <h4 class="section-title">Procedure Information</h4>
            <div class="table-container">
              <table>
                <tbody>
                  <tr><th>Procedure Name</th><td>${formData.procedureName}</td></tr>
                  <tr><th>Patient Name</th><td>${patient?.name || 'N/A'}</td></tr>
                  <tr><th>Consent Date</th><td>${formatDate(formData.consentDate)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="section-container">
            <h4 class="section-title">Procedure Details</h4>
            <div class="table-container">
              <table>
                <tbody>
                  <tr><th>Description</th><td>${formData.description}</td></tr>
                  <tr><th>Benefits</th><td>${formData.benefits}</td></tr>
                  <tr><th>Risks</th><td>${formData.risks.join(', ')}</td></tr>
                  <tr><th>Alternatives</th><td>${formData.alternatives.join(', ')}</td></tr>
                  ${formData.additionalNotes ? `<tr><th>Additional Notes</th><td>${formData.additionalNotes}</td></tr>` : ''}
                </tbody>
              </table>
            </div>
          </div>

          <div class="section-container">
            <h4 class="section-title">Patient Declaration</h4>
            <div class="table-container">
              <table>
                <tbody>
                  <tr><th>I understand that:</th><td>
                    • I have been informed about the procedure, its benefits and alternatives<br/>
                    • I have had the opportunity to ask questions and they have been answered<br/>
                    • I am consenting to this procedure voluntarily<br/>
                    • I can withdraw my consent at any time before the procedure
                  </td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="section-container">
            <h4 class="section-title">Signatures</h4>
                        <div class="signatures-container">
              <div class="signature-box">
                <h5>Patient Signature</h5>
                <div class="signature-content">
                  ${formData.patientSignature?.signed ? `
                    <img src="${formData.patientSignature.signatureImage}" alt="Patient Signature" class="signature-image" />
                    <div class="signature-info">
                      <strong>Signed:</strong> Yes<br/>
                      <strong>Date:</strong> ${formatDate(formData.patientSignature.signedAt)}<br/>
                      <strong>Status:</strong> Consent Confirmed
                    </div>
                  ` : `
                    <div class="signature-info">
                      <strong>Status:</strong> Pending Patient Signature<br/>
                      <em>Patient signature required before procedure</em>
                    </div>
                  `}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <span>Generated on ${formatDate(new Date())} | Preva Care Clinic Management System</span>
          </div>
      </body>
      </html>
    `;
  }

  async generatePdf(formData: IConsentForm, doctorMeta?: any): Promise<Buffer> {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const html = this.generateHTML(formData, doctorMeta);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  async uploadToS3(buffer: Buffer, fileName: string): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: `consent-pdfs/${fileName}`,
        Body: buffer,
        ContentType: 'application/pdf',
    });
    await s3Client.send(command);
    return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/consent-pdfs/${fileName}`;
  }
}

export default new ConsentPDFService();
