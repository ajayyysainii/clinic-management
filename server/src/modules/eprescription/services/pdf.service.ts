import dayjs from 'dayjs';
import { EPrescriptionDocument } from '../models/eprescription.model';
import { EPrescription } from '../models/eprescription.model';
import User from '../../user/models/user.model';
import Clinic from '../../clinic/models/clinic.model';
import DoctorMeta from '../../doctor/models/doctor.model';
import { ClinicPatient } from '../../patient/models/clinicPatient.model';
import { PDFGenerator } from '../../../utils/pdfGenerator';

export class PrescriptionPDFService {

  private sanitizeHtml(str: string): string {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async populatePrescriptionData(prescriptionData: EPrescriptionDocument): Promise<any> {
    try {
      // Fetch patient information
      let patientInfo = null;
      if (prescriptionData.patient) {
        const user = await User.findById(prescriptionData.patient).lean();
        if (user) {
          // Get clinic patient info if available
          const clinicPatient = await ClinicPatient.findOne({
            userId: prescriptionData.patient,
            clinicId: prescriptionData.clinic
          }).lean();

          patientInfo = {
            name: user.name,
            age: clinicPatient?.DOB ? this.calculateAge(clinicPatient.DOB) : null,
            gender: user.gender,
            bloodGroup: user.bloodGroup,
            phone: user.phone,
            email: user.email,
            ...clinicPatient
          };
        }
      }

      // Fetch doctor information
      let doctorInfo = null;
      if (prescriptionData.doctor) {
        const user = await User.findById(prescriptionData.doctor).lean();
        const doctorMeta = await DoctorMeta.findOne({ user_id: prescriptionData.doctor }).lean();

        if (user) {
          doctorInfo = {
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            name: user.name,
            email: user.email,
            phone: user.phone,
            specialization: doctorMeta?.specializations?.[0] || '',
            degree: doctorMeta?.degrees?.[0]?.title || '',
            medicalRegistrationNumber: doctorMeta?.eSign || '',
            bio: doctorMeta?.bio || '',
            yearsOfExperience: doctorMeta?.yearsOfExperience || 0,
            ...doctorMeta
          };
        }
      }

      // Fetch clinic information
      let clinicInfo = null;
      if (prescriptionData.clinic) {
        clinicInfo = await Clinic.findById(prescriptionData.clinic).lean();
      }

      return {
        ...prescriptionData.toObject(),
        patient: patientInfo,
        doctor: doctorInfo,
        clinic: clinicInfo
      };
    } catch (error) {
      console.error('Error populating prescription data:', error);
      return prescriptionData;
    }
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private generatePrescriptionHTML(prescriptionData: any) {
    const {
      patient = {} as any,
      doctor = {} as any,
      clinic = {} as any,
      date = new Date(),
      prescriptionID = '',
      vitals = {} as any,
      dx = [],
      sx = '',
      rx = [],
      labTest = [],
      advice = [],
      followUpSchedule = '',
      consultationMode = '',
    } = prescriptionData || {};

    console.log('Generating prescription HTML with data:', prescriptionData, rx);

    const formatDate = (date: Date) => {
      return date ? dayjs(date).format('DD/MM/YYYY') : '';
    };

        // Use clinic logo if available, otherwise use default
    const logoHtml = clinic?.logo
      ? `<img src="${clinic.logo}" alt="${clinic.name || 'Clinic'} Logo" style="max-height:40px; background-color:#ffffff; padding:10px; border-radius:10px;" />`
      : `<div style="background:#ffffff; padding:10px; border-radius:10px; font-weight:bold; color:#4b90e2; text-align:center;">
         <span style="font-size:1.5rem;">${clinic?.name || 'Preva Care'}</span>
       </div>`;

    // Get clinic address
    const clinicAddress = clinic?.availableLocations?.[0]
      ? `${clinic.availableLocations[0].street}, ${clinic.availableLocations[0].city}, ${clinic.availableLocations[0].state} ${clinic.availableLocations[0].zipCode}`
      : '';

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>E-Prescription</title>
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
      .doctor-info {
        flex: 1;
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

      /* Multi-column tables */
      table.multi-col th {
        width: auto;
      }
      table.multi-col td {
        width: auto;
      }

      /* Long text handling */
      .long-text {
        white-space: pre-wrap;
        word-wrap: break-word;
        max-width: 100%;
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
      <div class="doctor-info">
        <h2>${doctor.firstName || 'Doctor'} ${doctor.lastName}</h2>
        <p>${doctor.specialization || ''}</p>
        <p>${doctor.degree || ''}</p>

      </div>
      <div class="logo">
        ${logoHtml}
        <div class="logo-address">
          <small>${clinic?.name || 'Preva Care'}<br />${clinicAddress || 'Electronic Medical Record System'}</small>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="title">PRESCRIPTION</div>

      <div class="section-container">
        <h4 class="section-title">Patient Information</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr>
                <th>Name</th>
                <td>${patient.name || ''}</td>
              </tr>
              <tr>
                <th>Age / Gender</th>
                <td>${patient.age || ''} ${patient.gender || ''}</td>
              </tr>
              <tr>
                <th>Blood Group</th>
                <td>${patient.bloodGroup || 'N/A'}</td>
              </tr>
              <tr>
                <th>Phone</th>
                <td>${patient.phone || 'N/A'}</td>
              </tr>
              <tr>
                <th>Date</th>
                <td>${formatDate(date)}</td>
              </tr>
              <tr>
                <th>Prescription ID</th>
                <td>${prescriptionID || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Vitals -->
      <div class="section-container">
        <h4 class="section-title">Vital Signs${consultationMode === 'online' ? '<i>(as per patient)</i>' : ''}</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr><th>Blood Pressure</th><td>${vitals.BP ? `${vitals.BP} mmHg` : 'NA'}</td></tr>
              <tr><th>Pulse Rate</th><td>${vitals.PR ? `${vitals.PR} bpm` : 'NA'}</td></tr>
              <tr><th>SpO2</th><td>${vitals.SpO2 ? `${vitals.SpO2} %` : 'NA'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Symptoms -->
      ${sx ? `
      <div class="section-container">
        <h4 class="section-title">Symptoms</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr><th>Presenting Complaints</th><td>${sx}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Diagnosis -->
      ${dx && dx.length > 0 ? `
      <div class="section-container">
        <h4 class="section-title">Diagnosis</h4>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Diagnosis</th>
                <th>Date</th>
            </tr>
            </thead>
            <tbody>
              ${dx.map((diagnosis: any) => `
            <tr>
                  <td>${diagnosis.diagnosisName || ''}</td>
                  <td>${formatDate(diagnosis.dateOfDiagnosis)}</td>
            </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Medications -->
      ${rx && rx.length > 0 ? `
      <div class="section-container">
        <h4 class="section-title">Medications</h4>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Quantity</th>
            </tr>
            </thead>
            <tbody>
              ${rx.map((medicine: any) => `
                <tr>
                  <td>${medicine.drugName || ''}</td>
                  <td>${medicine.freequency || ''}</td>
                  <td>${medicine.duration || ''}</td>
                  <td>${medicine.quantity || ''}</td>
            </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Lab Tests -->
      ${labTest && labTest.length > 0 ? `
      <div class="section-container">
        <h4 class="section-title">Laboratory Tests</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr>
                <th>Recommended Tests</th>
                <td>${labTest.join(', ')}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Advice -->
      ${advice && advice.length > 0 ? `
      <div class="section-container">
        <h4 class="section-title">Medical Advice</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr>
                <th>Instructions</th>
                <td>${advice.join('<br>')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Follow-up -->
      ${followUpSchedule ? `
      <div class="section-container">
        <h4 class="section-title">Follow-up</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr>
                <th>Next Visit</th>
                <td>${followUpSchedule}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <span> 2025 ${clinic?.name || 'Preva Care'} | Electronic Prescription System</span>
    </div>
  </body>
</html>
`;
  }



  async generatePrescriptionPDF(prescriptionData: EPrescriptionDocument): Promise<string> {
    try {
      console.log('Generating prescription PDF for:', prescriptionData._id);

      // Populate prescription data with patient, doctor, and clinic information
      const populatedData = await this.populatePrescriptionData(prescriptionData);
      console.log('Populated prescription data:', populatedData);

      // Generate HTML content with populated data
      const htmlContent = this.generatePrescriptionHTML(populatedData);

      // Generate PDF using shared PDF generator
      const fileName = `Prescription_${prescriptionData._id}_${Date.now()}.pdf`;
      const pdfLink = await PDFGenerator.generatePDF(htmlContent, fileName, {
        headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Electronic Prescription</div>`,
        footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          <div> 2025 ${populatedData.clinic?.name || 'Preva Care'}</div>
        </div>`,
      });

      console.log('PDF generated and uploaded successfully:', pdfLink);
      return pdfLink;
    } catch (err) {
      console.error('PDF Generation Error:', err);
      throw err;
    }
  }
}
