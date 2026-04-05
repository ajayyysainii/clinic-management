import { Types } from 'mongoose';
import { EPrescription } from '../models/eprescription.model';
import { EPrescriptionDocument } from '../models/eprescription.model';
import { PrescriptionPDFService } from './pdf.service';

export class EprescriptionService {
  private pdfService: PrescriptionPDFService;

  constructor() {
    this.pdfService = new PrescriptionPDFService();
  }

  async createEPrescription(prescriptionData: Partial<EPrescriptionDocument>): Promise<EPrescriptionDocument> {
    try {
      const prescription = new EPrescription(prescriptionData);
      const savedPrescription = await prescription.save();

      // Generate PDF and update the prescription with the link
      try {
        const pdfLink = await this.pdfService.generatePrescriptionPDF(savedPrescription);
        savedPrescription.link = pdfLink;
        await savedPrescription.save();
        console.log('PDF generated and saved for prescription:', savedPrescription._id);
      } catch (pdfError) {
        console.error('Error generating PDF for prescription:', savedPrescription._id, pdfError);
        // Continue even if PDF generation fails
      }

      return savedPrescription;
    } catch (error) {
      console.error('Service error creating e-prescription:', error);
      throw error;
    }
  }

    async getEPrescriptionByPatientId(id: Types.ObjectId): Promise<EPrescriptionDocument[]> {
    try {
      return await EPrescription.find({ patient: id })
        .populate('patient')
        .populate('doctor')
        .populate('clinic')
        .populate('createdBy')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error('Service error fetching e-prescription by ID:', error);
      throw error;
    }
  }

  async getEPrescriptionById(id: Types.ObjectId): Promise<EPrescriptionDocument | null> {
    try {
      return await EPrescription.findById(id)
        .populate('patient')
        .populate('doctor')
        .populate('clinic')
        .populate('createdBy')
        .exec();
    } catch (error) {
      console.error('Service error fetching e-prescription by ID:', error);
      throw error;
    }
  }

  async getEPrescriptionsByUser(userId: Types.ObjectId): Promise<EPrescriptionDocument[]> {
    try {
      return await EPrescription.find({ patient: userId })
        .populate('patient')
        .populate('doctor')
        .populate('clinic')
        .populate('createdBy')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error('Service error fetching e-prescriptions by user:', error);
      throw error;
    }
  }

  async updateEPrescription(
    id: Types.ObjectId,
    updateData: Partial<EPrescriptionDocument>
  ): Promise<EPrescriptionDocument | null> {
    try {
      // Remove fields that shouldn't be updated
      const { _id, createdAt, ...safeUpdateData } = updateData as any;

      return await EPrescription.findByIdAndUpdate(
        id,
        {
          ...safeUpdateData,
          updatedAt: new Date()
        },
        {
          new: true,
          runValidators: true
        }
      )
      .populate('patient')
      .populate('doctor')
      .populate('clinic')
      .populate('createdBy')
      .exec();
    } catch (error) {
      console.error('Service error updating e-prescription:', error);
      throw error;
    }
  }

  async deleteEPrescription(id: Types.ObjectId): Promise<EPrescriptionDocument | null> {
    try {
      return await EPrescription.findByIdAndDelete(id).exec();
    } catch (error) {
      console.error('Service error deleting e-prescription:', error);
      throw error;
    }
  }

  async searchEPrescriptions(query: string, userId: Types.ObjectId): Promise<EPrescriptionDocument[]> {
    try {
      const searchRegex = new RegExp(query, 'i');

      return await EPrescription.find({
        patient: userId,
        $or: [
          { 'patient.name': searchRegex },
          { 'doctor.firstName': searchRegex },
          { 'doctor.lastName': searchRegex },
          { prescriptionID: searchRegex },
          { 'medications.name': searchRegex },
          { 'medications.genericName': searchRegex },
        ],
      })
        .populate('patient')
        .populate('doctor')
        .populate('clinic')
        .populate('createdBy')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error('Service error searching e-prescriptions:', error);
      throw error;
    }
  }

  async getEPrescriptionsByDateRange(
    userId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<EPrescriptionDocument[]> {
    try {
      return await EPrescription.find({
        patient: userId,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      })
        .populate('patient')
        .populate('doctor')
        .populate('clinic')
        .populate('createdBy')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error('Service error fetching e-prescriptions by date range:', error);
      throw error;
    }
  }

  async getEPrescriptionsByStatus(
    userId: Types.ObjectId,
    status: string
  ): Promise<EPrescriptionDocument[]> {
    try {
      return await EPrescription.find({
        patient: userId,
        status: status
      })
        .populate('patient')
        .populate('doctor')
        .populate('clinic')
        .populate('createdBy')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error('Service error fetching e-prescriptions by status:', error);
      throw error;
    }
  }

  async countEPrescriptionsByUser(userId: Types.ObjectId): Promise<number> {
    try {
      return await EPrescription.countDocuments({ patient: userId });
    } catch (error) {
      console.error('Service error counting e-prescriptions:', error);
      throw error;
    }
  }

  async regeneratePrescriptionPDF(id: Types.ObjectId): Promise<string> {
    try {
      const prescription = await EPrescription.findById(id);
      if (!prescription) {
        throw new Error('Prescription not found');
      }

      const pdfLink = await this.pdfService.generatePrescriptionPDF(prescription);
      prescription.link = pdfLink;
      await prescription.save();

      console.log('PDF regenerated for prescription:', prescription._id);
      return pdfLink;
    } catch (error) {
      console.error('Service error regenerating prescription PDF:', error);
      throw error;
    }
  }

  async getImagesByUser(userId: Types.ObjectId): Promise<Array<{
    prescriptionDate: Date;
    images: { url: string; remark: string }[];
  }>> {
    try {
      const prescriptions = await EPrescription.find({
        patient: userId,
        images: { $exists: true, $ne: [], $not: { $size: 0 } }
      })
        .populate('patient')
        .populate('doctor')
        .populate('clinic')
        .populate('createdBy')
        .sort({ createdAt: -1 })
        .exec();

      return prescriptions.map(prescription => ({
        prescriptionDate: prescription.date || prescription.createdAt,
        images: prescription.images || []
      }));
    } catch (error) {
      console.error('Service error fetching images by user:', error);
      throw error;
    }
  }
}

