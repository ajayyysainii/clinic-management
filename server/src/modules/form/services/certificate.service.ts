import { Certificate, ICertificate, CertificateType, FitnessType } from '../models/certificate.model';
import { User } from '../../user/models';
import { Clinic } from '../../clinic/models';
import { ClinicPatient } from '../../patient/models';
import { DoctorMeta } from '../../doctor/models';
import { generatePdfFromHtml, uploadPdfToS3 } from '../../../utils/pdf';
import mongoose from 'mongoose';

export class CertificateService {
  async createCertificate(data: Partial<ICertificate>): Promise<ICertificate> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Fetch patient details
      const patient = await User.findById(data.patientId).session(session);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Fetch clinic patient details for age calculation
      const clinicPatient = await ClinicPatient.findOne({
        userId: data.patientId,
        clinicId: data.clinicId,
        deletedAt: null
      }).session(session);

      // Calculate age
      const age = clinicPatient?.DOB
        ? Math.floor((new Date().getTime() - new Date(clinicPatient.DOB).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 0;

      // Fetch doctor details
      const doctor = await User.findById(data.doctorId).session(session);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Fetch doctor meta for qualifications
      const doctorMeta = await DoctorMeta.findOne({ user_id: data.doctorId }).session(session);
      const qualification = doctorMeta?.degrees && doctorMeta.degrees.length > 0
        ? doctorMeta.degrees.map(d => d.title).join(', ')
        : 'MBBS';

      // Fetch clinic details
      const clinic = await Clinic.findById(data.clinicId).session(session);
      if (!clinic) {
        throw new Error('Clinic not found');
      }

      // Get clinic address

      // Prepare certificate data
      const certificateData = {
        ...data,
        patientName: patient.name,
        patientAge: age,
        patientGender: patient.gender || 'Not specified',
        patientIdString: patient._id.toString(),
        doctorName: doctor.name,
        doctorQualification: qualification,
        doctorRegNumber: doctorMeta?.eSign || 'Not specified',
        clinicName: clinic.name,
        clinicLogo: clinic.logo,
        clinicAddress: clinic.availableLocations && clinic.availableLocations.length > 0
          ? `${clinic.availableLocations[0].street}, ${clinic.availableLocations[0].city}, ${clinic.availableLocations[0].state} - ${clinic.availableLocations[0].zipCode}`
          : 'Address not available',
        clinicPhone: clinic.phone,
        clinicEmail: clinic.email,
        issuedDate: new Date(),
        place: clinic.availableLocations?.[0]?.city || 'Not specified',
      };

      const certificate = new Certificate(certificateData);
      const savedCertificate = await certificate.save({ session });

      // Generate PDF
      const pdfUrl = await this.generateCertificatePDF(savedCertificate);

      // Update certificate with PDF URL
      savedCertificate.pdfUrl = pdfUrl;
      await savedCertificate.save({ session });

      await session.commitTransaction();
      return savedCertificate;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getCertificates(filter: any = {}): Promise<ICertificate[]> {
    return await Certificate.find(filter).populate('patientId', 'name email phone').populate('doctorId', 'name');
  }

  async getCertificateById(id: string): Promise<ICertificate | null> {
    return await Certificate.findById(id).populate('patientId', 'name email phone').populate('doctorId', 'name');
  }

  async getCertificatesByPatient(patientId: string): Promise<ICertificate[]> {
    return await Certificate.find({ patientId }).populate('doctorId', 'name').sort({ issuedDate: -1 });
  }

  async getCertificatesByDoctor(doctorId: string): Promise<ICertificate[]> {
    return await Certificate.find({ doctorId }).populate('patientId', 'name email phone').sort({ issuedDate: -1 });
  }

  async getCertificatesByClinic(clinicId: string): Promise<ICertificate[]> {
    return await Certificate.find({ clinicId }).populate('patientId', 'name email phone').populate('doctorId', 'name').sort({ issuedDate: -1 });
  }

  async updateCertificate(id: string, data: Partial<ICertificate>): Promise<ICertificate | null> {
    const certificate = await Certificate.findByIdAndUpdate(id, data, { new: true });
    if (certificate) {
      // Regenerate PDF if needed
      const pdfUrl = await this.generateCertificatePDF(certificate);
      certificate.pdfUrl = pdfUrl;
      await certificate.save();
    }
    return certificate;
  }

  async deleteCertificate(id: string): Promise<boolean> {
    const result = await Certificate.findByIdAndDelete(id);
    return !!result;
  }

  private async generateCertificatePDF(certificate: ICertificate): Promise<string> {
    const html = this.generateCertificateHTML(certificate);
    const pdfBuffer = await generatePdfFromHtml(html);
    const fileName = `certificate_${certificate.certificateType}_${certificate._id}_${Date.now()}.pdf`;
    const pdfUrl = await uploadPdfToS3(pdfBuffer, fileName, 'certificates');
    return pdfUrl;
  }

  private generateCertificateHTML(certificate: ICertificate): string {
    const isSickness = certificate.certificateType === CertificateType.SICKNESS;
    const title = isSickness ? 'SICKNESS CERTIFICATE' : 'MEDICAL FITNESS CERTIFICATE';

    const fitnessTypesText = certificate.fitnessTypes?.map(type => {
      switch (type) {
        case FitnessType.WORK: return 'Work';
        case FitnessType.SCHOOL: return 'School';
        case FitnessType.PHYSICAL_ACTIVITY: return 'Physical activity';
        case FitnessType.TRAVEL: return 'Travel';
        case FitnessType.CUSTOM: return certificate.customFitnessType || 'Custom';
        default: return type;
      }
    }).join(', ');

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const formatDateFull = (date: Date) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
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
          .certificate-content {
            margin: 1.5rem 0;
            text-align: justify;
            font-size: 14px;
            line-height: 1.8;
          }
          .certificate-content p {
            margin-bottom: 1rem;
          }
          .stamp-area {
            margin-top: 2rem;
            text-align: center;
            min-height: 80px;
            border: 2px dashed #0096F2;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0096F2;
            font-weight: 600;
            background: #f8f9fa;
          }
          /* Print-specific styles */
          @media print {
            .footer {
              background-color: #0096F2 !important;
              color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
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
              <h2>Dr. ${certificate.doctorName}</h2>
              <p>${certificate.doctorQualification}</p>
              <p>${title}</p>
              <p>Date: ${formatDate(certificate.issuedDate)}</p>
            </div>
            <div class="logo">
              ${certificate.clinicLogo ? `<img src="${certificate.clinicLogo}" alt="Clinic Logo" class="logo">` : ''}
              <div class="logo-address">
                ${certificate.clinicName}<br>
                ${certificate.clinicPhone ? `Phone: ${certificate.clinicPhone}` : ''}
                ${certificate.clinicEmail ? `Email: ${certificate.clinicEmail}` : ''}
              </div>
            </div>
          </div>
        </div>

        <h1 class="title">${title}</h1>

        <div class="container-fluid px-4">
          <!-- Patient Information -->
          <div class="section-container">
            <h4 class="section-title">Patient Information</h4>
            <div class="table-container">
              <table>
                <tbody>
                  <tr><th>Patient Name</th><td>${certificate.patientName}</td></tr>
                  <tr><th>Age</th><td>${certificate.patientAge} years</td></tr>
                </tbody>
              </table>
            </div>
          </div>

                  <!-- Certificate Details -->
          <div class="section-container">
            <h4 class="section-title">Certificate Details</h4>
            <div class="table-container">
              <table>
                <tbody>
                  <tr><th>Certificate Type</th><td>${isSickness ? 'Sickness Certificate' : 'Medical Fitness Certificate'}</td></tr>
                  <tr><th>Issued Date</th><td>${formatDateFull(certificate.issuedDate)}</td></tr>
                  <tr><th>Place</th><td>${certificate.place}</td></tr>
                  ${certificate.startDate ? `<tr><th>Start Date</th><td>${formatDate(certificate.startDate)}</td></tr>` : ''}
                  ${certificate.endDate ? `<tr><th>End Date</th><td>${formatDate(certificate.endDate)}</td></tr>` : ''}
                  ${certificate.numberOfDays ? `<tr><th>Duration</th><td>${certificate.numberOfDays} days</td></tr>` : ''}
                  ${certificate.examinationDate ? `<tr><th>Examination Date</th><td>${formatDate(certificate.examinationDate)}</td></tr>` : ''}
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
                  ${certificate.diagnosis ? `<tr><th>Diagnosis</th><td class="long-text">${certificate.diagnosis}</td></tr>` : ''}
                  ${!isSickness && fitnessTypesText ? `<tr><th>Fitness For</th><td>${fitnessTypesText}</td></tr>` : ''}
                  ${certificate.isUnfit !== undefined ? `<tr><th>Fitness Status</th><td>${certificate.isUnfit ? 'Unfit' : 'Fit'}</td></tr>` : ''}
                  ${certificate.isOnMedication !== undefined ? `<tr><th>Medication Status</th><td>${certificate.isOnMedication ? 'On Medication' : 'Without Medication'}</td></tr>` : ''}
                  ${certificate.isStable !== undefined ? `<tr><th>Health Status</th><td>${certificate.isStable ? 'Stable' : 'Not Stable'}</td></tr>` : ''}
                  ${certificate.remarks ? `<tr><th>Remarks</th><td class="long-text">${certificate.remarks}</td></tr>` : ''}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Certificate Content -->
          <div class="section-container">
            <h4 class="section-title">Certificate Statement</h4>
            <div class="certificate-content">
              ${isSickness ? `
                <p>This is to certify that <strong>${certificate.patientName}</strong>,
                Age: <strong>${certificate.patientAge}</strong> years, has been under my medical care for the treatment of
                <strong>${certificate.diagnosis || 'medical condition'}</strong>.</p>

                <p>In my professional opinion, the patient is <strong>${certificate.isUnfit ? 'unfit' : 'fit'}</strong> 
                ${certificate.endDate ? `from <strong>${formatDate(certificate.startDate)}</strong> to <strong>${formatDate(certificate.endDate)}</strong>` :
                `from <strong>${formatDate(certificate.startDate)}</strong> for a likely period of <strong>${certificate.numberOfDays || 'specified'} days</strong>`}
                due to the above medical condition.</p>

                <p>The patient is advised to take rest and follow the prescribed treatment during this period.</p>
              ` : `
                <p>This is to certify that Mr./Ms. <strong>${certificate.patientName}</strong>,
                Age: <strong>${certificate.patientAge}</strong> years,was examined by me on
                <strong>${formatDate(certificate.examinationDate || certificate.startDate)}</strong>.</p>

                <p>Upon thorough clinical evaluation, I find the patient to be medically fit to resume:</p>
                <p><strong>${fitnessTypesText || 'Regular activities'}</strong></p>

                ${certificate.isOnMedication !== undefined ? `
                  <p>He/She is suffering from <strong>${certificate.diagnosis || 'medical condition'}</strong> and the patient is
                  <strong>${certificate.isStable ? 'stable' : 'not stable'}</strong> and <strong>${certificate.isOnMedication ? 'on medication' : 'without medication'}</strong>.</p>
                ` : `
                  <p>There is no evidence of any active illness or condition that would impair the individual's health or ability to perform regular activities as of the date of examination.</p>
                `}
              `}

              ${certificate.remarks ? `<p><strong>Additional Remarks:</strong> ${certificate.remarks}</p>` : ''}
            </div>
          </div>

          <!-- Signature Section -->
          <div class="section-container">
            <h4 class="section-title">Authentication</h4>
            <div class="table-container">
              <table>
                <tbody>
                  <tr><th>Doctor's Name</th><td>Dr. ${certificate.doctorName}</td></tr>
                  <tr><th>Qualification</th><td>${certificate.doctorQualification}</td></tr>
                  <tr><th>Issued Date</th><td>${formatDateFull(certificate.issuedDate)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        <div class="footer">
          <span>2025 Preva Care | Certificate Management System</span>
        </div>
      </body>
      </html>`;
  }
}
