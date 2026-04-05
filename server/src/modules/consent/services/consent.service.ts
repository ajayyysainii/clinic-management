import { ConsentForm, IConsentForm } from '../models/consent.model';
import { FilterQuery } from 'mongoose';
import ConsentPDFService from './consent.pdf.service';
import DoctorMeta from '../../doctor/models/doctor.model';

class ConsentService {
  async createConsentForm(input: Partial<IConsentForm>) {
    // Logic to create and save a new consent form
    return ConsentForm.create(input);
  }

  async signConsentForm(
    formId: string,
    signatureData: { signatureImage: string; signedAt: Date }
  ) {
    const { signatureImage, signedAt } = signatureData;

    const updatedForm = await ConsentForm.findByIdAndUpdate(
      formId,
      {
        $set: {
          'patientSignature.signed': true,
          'patientSignature.signedAt': signedAt,
          'patientSignature.signatureImage': signatureImage,
        },
      },
      { new: true }
    ).populate('patientId doctorId clinicId');

    if (updatedForm) {
      // Get doctor metadata for e-signature
      const doctorId = typeof updatedForm.doctorId === 'object' ? updatedForm.doctorId._id : updatedForm.doctorId;
      const doctorMeta = await DoctorMeta.findOne({ user_id: doctorId });
      console.log('Doctor ID for metadata lookup:', doctorId);
      console.log('Found doctor metadata:', doctorMeta);

      // PDF Generation and Upload
      const pdfBuffer = await ConsentPDFService.generatePdf(updatedForm, doctorMeta);
      const fileName = `consent-${updatedForm._id}-${Date.now()}.pdf`;
      const pdfUrl = await ConsentPDFService.uploadToS3(pdfBuffer, fileName);

      // Save the PDF URL back to the document
      updatedForm.pdfUrl = pdfUrl;
      await updatedForm.save();
    }

    return updatedForm;
  }

  async getConsentFormsByDoctor(doctorId: string) {
    // Logic to find forms by doctor
    return ConsentForm.find({ doctorId }).populate('patientId', 'name').populate('doctorId', 'name').populate('clinicId', 'name logo address');
  }

  async getConsentFormsByClinic(clinicId: string) {
    // Logic to find forms by clinic
    return ConsentForm.find({ clinicId }).populate('patientId', 'name').populate('doctorId', 'name').populate('clinicId', 'name logo address');
  }

  async getConsentFormsByPatient(patientId: string) {
    // Logic to find forms by patient
    return ConsentForm.find({ patientId }).populate('patientId', 'name').populate('doctorId', 'name').populate('clinicId', 'name logo address');
  }

  async getConsentFormById(id: string) {
    // Logic to find a single form by ID
    return ConsentForm.findById(id).populate('patientId doctorId clinicId');
  }

  async generateConsentPdf(formId: string): Promise<Buffer> {
    const form = await ConsentForm.findById(formId).populate('patientId doctorId clinicId');
    if (!form) {
      throw new Error('Consent form not found');
    }

    // Get doctor metadata for e-signature
    const doctorId = typeof form.doctorId === 'object' ? form.doctorId._id : form.doctorId;
    const doctorMeta = await DoctorMeta.findOne({ user_id: doctorId });
    console.log('Generating PDF for consent:', formId);
    console.log('Doctor ID:', doctorId);
    console.log('Found doctor metadata:', doctorMeta);

    return ConsentPDFService.generatePdf(form, doctorMeta);
  }
}

export default new ConsentService();
