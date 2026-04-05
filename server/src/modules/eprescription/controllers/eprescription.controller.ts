import { Request, Response } from 'express';
import { EprescriptionService } from '../services/eprescription.service';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../../../types';
import { EPrescriptionDocument } from '../models/eprescription.model';
import WhatsAppService from '../../../utils/whatsappService';

export class EprescriptionController {
  private eprescriptionService: EprescriptionService;
  private whatsappService: WhatsAppService;

  constructor() {
    this.eprescriptionService = new EprescriptionService();
    this.whatsappService = new WhatsAppService();
  }

  createEPrescription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinic = req.currentUser?.clinic
      if (!clinic) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }
      const prescriptionData = {clinic,...req.body};

      // Parse JSON-stringified fields if needed
      const parseIfString = (field: any) => {
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch {
            return field;
          }
        }
        return field;
      };
      const fieldsToParse = ['vitals', 'dx', 'rx', 'patient', 'doctor', 'labTest'];
      fieldsToParse.forEach((key) => {
        if ((prescriptionData as any)[key] !== undefined) {
          (prescriptionData as any)[key] = parseIfString((prescriptionData as any)[key]);
        }
      });

      // Handle uploaded images
      let imageUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        imageUrls = (req.files as Express.Multer.File[]).map(file => (file as any).location);
      } else if (req.files && typeof req.files === 'object') {
        // If using upload.fields, req.files is an object
        const filesArr = Object.values(req.files).flat() as Express.Multer.File[];
        imageUrls = filesArr.map(file => (file as any).location);
      }
      // Parse imageRemarks from body (should be a JSON string array)
      let imageRemarks: string[] = [];
      if (req.body.imageRemarks) {
        try {
          imageRemarks = JSON.parse(req.body.imageRemarks);
        } catch (e) {
          imageRemarks = [];
        }
      }
      if (imageUrls.length > 0) {
        // Pair each image URL with its remark (by index)
        prescriptionData.images = imageUrls.map((url, idx) => ({ url, remark: imageRemarks[idx] || '' }));
      }


      const prescription = await this.eprescriptionService.createEPrescription(prescriptionData);

      // Send WhatsApp message with PDF link if prescription has a link
      try {
        if (prescription.link) {
          // Get patient and doctor details for WhatsApp message
          const User = require('../../user/models/user.model').default;
          const DoctorMeta = require('../../doctor/models/doctor.model').default;

          const patient = await User.findById(prescription.patient);
          const doctorMeta = await DoctorMeta.findOne({ user_id: prescription.doctor }).populate('user_id');

          if (patient && patient.phone) {
            const patientName = patient.name || 'Patient';
            const doctorName = doctorMeta?.user_id?.name || 'Doctor';

            await this.whatsappService.sendEprescriptionPdfLink(
              patientName,
              doctorName,
              prescription.link,
              patient.phone
            );
            console.log('✅ WhatsApp E-Prescription PDF message sent successfully to:', patient.phone);
          } else {
            console.log('⚠️ No patient phone number available for WhatsApp notification');
          }
        } else {
          console.log('⚠️ No PDF link available for WhatsApp notification');
        }
      } catch (whatsappError) {
        console.error('❌ Error sending WhatsApp E-Prescription PDF message:', whatsappError);
        // Don't fail the prescription creation if WhatsApp fails
      }

      res.status(201).json({
        success: true,
        message: 'E-prescription created successfully',
        data: prescription
      });
    } catch (error) {
      console.error('Error creating e-prescription:', error);

      if (error instanceof Error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
          res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.message
          });
          return;
        }

        // Handle duplicate key errors
        if (error.name === 'MongoServerError' && (error as any).code === 11000) {
          res.status(409).json({
            success: false,
            message: 'E-prescription with this ID already exists'
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create e-prescription'
      });
    }
  };

  getEPrescriptionByPatientId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
        return;
      }

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid Patient ID format'
        });
        return;
      }

      const prescriptions = await this.eprescriptionService.getEPrescriptionByPatientId(new Types.ObjectId(id));

      res.status(200).json({
        success: true,
        message: 'E-prescriptions retrieved successfully',
        data: prescriptions,
        count: prescriptions.length
      });
    } catch (error) {
      console.error('Error fetching e-prescription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch e-prescription'
      });
    }
  };

  getEPrescriptionsByUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.currentUser?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
        return;
      }

      const prescriptions = await this.eprescriptionService.getEPrescriptionsByUser(userId);

      res.status(200).json({
        success: true,
        message: 'E-prescriptions retrieved successfully',
        data: prescriptions,
        count: prescriptions.length
      });
    } catch (error) {
      console.error('Error fetching user e-prescriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch e-prescriptions'
      });
    }
  };

  updateEPrescription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: Partial<EPrescriptionDocument> = req.body;

      // Parse JSON-stringified fields if needed
      const parseIfString = (field: any) => {
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch {
            return field;
          }
        }
        return field;
      };
      const fieldsToParse = ['vitals', 'dx', 'rx', 'patient', 'doctor', 'labTest'];
      fieldsToParse.forEach((key) => {
        if ((updateData as any)[key] !== undefined) {
          (updateData as any)[key] = parseIfString((updateData as any)[key]);
        }
      });

      // Handle uploaded images
      let imageUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        imageUrls = (req.files as Express.Multer.File[]).map(file => (file as any).location);
      } else if (req.files && typeof req.files === 'object') {
        const filesArr = Object.values(req.files).flat() as Express.Multer.File[];
        imageUrls = filesArr.map(file => (file as any).location);
      }
      // Parse imageRemarks from body (should be a JSON string array)
      let imageRemarks: string[] = [];
      if (req.body.imageRemarks) {
        try {
          imageRemarks = JSON.parse(req.body.imageRemarks);
        } catch (e) {
          imageRemarks = [];
        }
      }
      if (imageUrls.length > 0) {
        updateData.images = imageUrls.map((url, idx) => ({ url, remark: imageRemarks[idx] || '' }));
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Prescription ID is required'
        });
        return;
      }

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid prescription ID format'
        });
        return;
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Update data is required'
        });
        return;
      }

      const updatedPrescription = await this.eprescriptionService.updateEPrescription(
        new Types.ObjectId(id),
        updateData
      );

      if (!updatedPrescription) {
        res.status(404).json({
          success: false,
          message: 'E-prescription not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'E-prescription updated successfully',
        data: updatedPrescription
      });
    } catch (error) {
      console.error('Error updating e-prescription:', error);

      if (error instanceof Error && error.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update e-prescription'
      });
    }
  };

  deleteEPrescription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Prescription ID is required'
        });
        return;
      }

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid prescription ID format'
        });
        return;
      }

      const deletedPrescription = await this.eprescriptionService.deleteEPrescription(new Types.ObjectId(id));

      if (!deletedPrescription) {
        res.status(404).json({
          success: false,
          message: 'E-prescription not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'E-prescription deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting e-prescription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete e-prescription'
      });
    }
  };

  searchEPrescriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { query } = req.params;
      const userId = req.currentUser?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
        return;
      }

      if (!query || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const prescriptions = await this.eprescriptionService.searchEPrescriptions(query, userId);

      res.status(200).json({
        success: true,
        message: 'E-prescriptions search completed successfully',
        data: prescriptions,
        count: prescriptions.length
      });
    } catch (error) {
      console.error('Error searching e-prescriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search e-prescriptions'
      });
    }
  };

  regeneratePrescriptionPDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Prescription ID is required'
        });
        return;
      }

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid prescription ID format'
        });
        return;
      }

      const pdfLink = await this.eprescriptionService.regeneratePrescriptionPDF(new Types.ObjectId(id));

      // Send WhatsApp message with regenerated PDF link
      try {
        // Get prescription details to find patient
        const prescription = await this.eprescriptionService.getEPrescriptionById(new Types.ObjectId(id));
        if (prescription) {
          const User = require('../../user/models/user.model').default;
          const DoctorMeta = require('../../doctor/models/doctor.model').default;

          const patient = await User.findById(prescription.patient);
          const doctorMeta = await DoctorMeta.findOne({ user_id: prescription.doctor }).populate('user_id');

          if (patient && patient.phone) {
            const patientName = patient.name || 'Patient';
            const doctorName = doctorMeta?.user_id?.name || 'Doctor';

            await this.whatsappService.sendEprescriptionPdfLink(
              patientName,
              doctorName,
              pdfLink,
              patient.phone
            );
            console.log('✅ WhatsApp E-Prescription regenerated PDF message sent successfully to:', patient.phone);
          } else {
            console.log('⚠️ No patient phone number available for WhatsApp notification');
          }
        }
      } catch (whatsappError) {
        console.error('❌ Error sending WhatsApp regenerated E-Prescription PDF message:', whatsappError);
        // Don't fail the PDF regeneration if WhatsApp fails
      }

      res.status(200).json({
        success: true,
        message: 'PDF regenerated successfully',
        data: { link: pdfLink }
      });
    } catch (error) {
      console.error('Error regenerating prescription PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate prescription PDF'
      });
    }
  };

  getImagesByUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      if (!Types.ObjectId.isValid(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
        return;
      }

      const imagesData = await this.eprescriptionService.getImagesByUser(new Types.ObjectId(userId));

      res.status(200).json({
        success: true,
        message: 'Images retrieved successfully',
        data: imagesData,
        count: imagesData.length
      });
    } catch (error) {
      console.error('Error fetching user images:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch images'
      });
    }
  };
}
