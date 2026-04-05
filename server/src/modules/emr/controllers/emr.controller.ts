import { Request, Response } from 'express'
import { EmrService } from '../services/emr.service'
import { Types } from 'mongoose'
import { AuthenticatedRequest } from '../../../types'
import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'
import puppeteer from 'puppeteer'
import type { Browser } from 'puppeteer'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import s3Client from '../../../utils/s3Client'
import { PDFGenerator } from '../../../utils/pdfGenerator'
import WhatsAppService from '../../../utils/whatsappService'

export class EmrController {
  private emrService: EmrService
  private whatsappService: WhatsAppService

  constructor() {
    this.emrService = new EmrService()
    this.whatsappService = new WhatsAppService()
  }

  // Create new EMR record
  createEmr = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let browser: Browser | null = null
    try {
      const clinic = req.currentUser?.clinic
      if (!clinic) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const emrData = req.body

      // Debug: Log the received data
      console.log('Received EMR data:', emrData);
      console.log('Doctor ID from request:', emrData.doctor);
      console.log('User ID from request:', emrData.user);

      const finalData = { ...emrData, clinic }

      // Handle uploaded images and remarks
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
        finalData.images = imageUrls.map((url, idx) => ({ url, remark: imageRemarks[idx] || '' }));
      }

      // Parse JSON-stringified fields to objects/arrays for Mongoose
      const fieldsToParse = [
        'history',
        'immunization',
        'generalPhysicalExamination',
        'systemicExamination',
        'diagnosis'
      ];
      fieldsToParse.forEach((key) => {
        if (typeof finalData[key] === 'string') {
          try {
            finalData[key] = JSON.parse(finalData[key]);
          } catch {
            // leave as is if parsing fails
          }
        }
      });

      // Validate ObjectIds
      if (!Types.ObjectId.isValid(emrData.user)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID format',
        })
        return
      }
      if (!Types.ObjectId.isValid(emrData.doctor)) {
        res.status(400).json({
          success: false,
          message: 'Invalid doctor ID format',
        })
        return
      }

      // Fetch user details for patient
      const User = require('../../user/models/user.model').default;
      const user = await User.findById(emrData.user);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User (patient) not found',
        })
        return;
      }
      // Attach user details to finalData.basicInfo with correct types
      const validBloodGroups = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-', 'not known'];
      const bloodGroup = (user.bloodGroup && validBloodGroups.includes(user.bloodGroup)) ? user.bloodGroup : undefined;
      finalData.basicInfo = {
        name: user.name || '',
        age: emrData.age ? Number(emrData.age) : undefined,
        children: emrData.children ? Number(emrData.children) : undefined,
        gender: (user.gender === 'Male' || user.gender === 'M') ? 'M' : (user.gender === 'Female' || user.gender === 'F') ? 'F' : undefined,
        phoneNumber: user.phone || '',
        bloodGroup,
        maritalStatus: typeof emrData.maritalStatus === 'boolean' ? emrData.maritalStatus : undefined,
        address: (emrData.basicInfo && emrData.basicInfo.address) ? emrData.basicInfo.address : (user.address || {}),
      };

      // Fetch doctor details and populate user_id
      const DoctorMeta = require('../../doctor/models/doctor.model').default;
      console.log('Looking for doctor with user_id:', emrData.doctor);
      let doctorMeta = await DoctorMeta.findOne({ user_id: emrData.doctor }).populate('user_id');
      console.log('Found doctor meta:', doctorMeta);

      // If doctor not found, try to find a doctor from the same clinic
      if (!doctorMeta) {
        console.log('Doctor not found for user_id:', emrData.doctor);
        console.log('Trying to find a doctor from the same clinic...');

        // Try to find any doctor from the same clinic
        const User = require('../../user/models/user.model').default;
        const usersInClinic = await User.find({ clinic: clinic });
                  console.log('Users in clinic:', usersInClinic.map((u: any) => ({ id: u._id, name: u.name, role: u.role })));

          // Find a user with doctor role in the same clinic
          const doctorUser = usersInClinic.find((u: any) => u.role === 'doctor');
        if (doctorUser) {
          console.log('Found doctor user in clinic:', doctorUser._id);
          doctorMeta = await DoctorMeta.findOne({ user_id: doctorUser._id }).populate('user_id');
          console.log('Found doctor meta for clinic doctor:', doctorMeta);
        }

        // If still no doctor found, use the current user if they are a doctor
        if (!doctorMeta && req.currentUser?.roles?.includes('doctor')) {
          console.log('Using current user as doctor');
          doctorMeta = await DoctorMeta.findOne({ user_id: req.currentUser._id }).populate('user_id');
          console.log('Found doctor meta for current user:', doctorMeta);
        }

        // If still no doctor found, create a minimal doctor record
        if (!doctorMeta) {
          console.log('No doctor found, creating minimal doctor record');
          const currentUser = await User.findById(req.currentUser?._id);
          if (currentUser) {
            doctorMeta = {
              user_id: currentUser,
              bio: '',
              yearsOfExperience: 0,
              specializations: [],
              eSign: '',
            };
            console.log('Created minimal doctor record:', doctorMeta);
          }
        }
      }

      if (!doctorMeta) {
        console.log('No doctor found and could not create one');
        res.status(404).json({
          success: false,
          message: 'Doctor not found and no suitable doctor available',
        })
        return;
      }

      // Attach doctor name and details to finalData
      finalData.doctorDetails = {
        name: doctorMeta.user_id?.name || '',
        bio: doctorMeta.bio || '',
        yearsOfExperience: doctorMeta.yearsOfExperience || '',
        specializations: doctorMeta.specializations || [],
        eSign: doctorMeta.eSign || '',
      };

      const validModes = ['on site', 'online', 'home']
      if (!validModes.includes(emrData.consultationMode)) {
        res.status(400).json({
          success: false,
          message: 'Invalid consultation mode. Must be one of: on site, online, home',
        })
        return
      }
      // Create EMR
      const newEmr = await this.emrService.createEmr(finalData)

      if (!newEmr) {
        res.status(500).json({
          success: false,
          message: 'Failed to create EMR record',
        })
        return;
      }
      // Generate PDF and upload to S3
      try {
        // Fetch clinic details for EMR
        const { ClinicService } = require('../../clinic/services/clinic.service');
        const clinicService = new ClinicService();
        const clinicId = req.currentUser?.clinic;
        const clinic = await clinicService.getClinicById(clinicId);
        if (!clinic) {
          res.status(404).json({
            success: false,
            message: 'Clinic not found',
          })
          return;
        }
        // Prepare clinic info for PDF
        const clinicAddress = clinic.availableLocations && clinic.availableLocations.length > 0
          ? `${clinic.availableLocations[0].place || ''}, ${clinic.availableLocations[0].street || ''}, ${clinic.availableLocations[0].city || ''}, ${clinic.availableLocations[0].state || ''} - ${clinic.availableLocations[0].zipCode || ''}`
          : '';
        finalData.clinicDetails = {
          name: clinic.name || '',
          address: clinicAddress,
          logo: clinic.logo,
        };
        // Generate HTML
        const html = this.getEmrHTML({ ...newEmr!.toObject(), doctor: finalData.doctorDetails, basicInfo: finalData.basicInfo, clinic: finalData.clinicDetails })
        // Generate PDF using shared PDF generator
        const fileName = `emr_${newEmr!._id}_${Date.now()}.pdf`
        const s3Url = await PDFGenerator.generatePDF(html, fileName, {
          headerTemplate:
            '<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Electronic Medical Record</div>',
          footerTemplate:
            '<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">Page <span class="pageNumber"></span> of <span class="totalPages"></span><div> 2025 Preva Care</div></div>',
        })
        // Save S3 link in EMR document
        await this.emrService.updateEmr(newEmr!._id as string, { emrPdfFileUrl: s3Url })

        // Send WhatsApp message with PDF link
        try {
          const patientName = finalData.basicInfo?.name || user.name || 'Patient';
          const doctorName = finalData.doctorDetails?.name || doctorMeta.user_id?.name || 'Doctor';
          const patientPhoneNumber = finalData.basicInfo?.phoneNumber || user.phone;

          if (patientPhoneNumber) {
            await this.whatsappService.sendEmrPdfLink(
              patientName,
              doctorName,
              s3Url,
              patientPhoneNumber
            );
            console.log('✅ WhatsApp EMR PDF message sent successfully to:', patientPhoneNumber);
          } else {
            console.log('⚠️ No patient phone number available for WhatsApp notification');
          }
        } catch (whatsappError) {
          console.error('❌ Error sending WhatsApp EMR PDF message:', whatsappError);
          // Don't fail the EMR creation if WhatsApp fails
        }

        // Respond with S3 link included
        res.status(201).json({
          success: true,
          message: 'EMR record created successfully',
          data: { ...newEmr!.toObject(), emrPdfFileUrl: s3Url },
        })
      } catch (pdfErr: any) {
        // Respond with EMR created but PDF failed
        res.status(201).json({
          success: true,
          message: 'EMR record created, but PDF generation/upload failed',
          data: newEmr,
          pdfError: pdfErr?.message || 'Unknown PDF error',
        })
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create EMR record',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Get EMR by ID
  getEmrById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid EMR ID format',
        })
        return
      }

      const emr = await this.emrService.getEmrById(id)

      if (!emr) {
        res.status(404).json({
          success: false,
          message: 'EMR record not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'EMR record retrieved successfully',
        data: emr,
      })
    } catch (error) {
      console.error('Error retrieving EMR:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve EMR record',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Get all EMRs for a specific user
  getEmrsByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

      if (!Types.ObjectId.isValid(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID format',
        })
        return
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      }

      const result = await this.emrService.getEmrsByUserId(userId, options)

      res.status(200).json({
        success: true,
        message: 'EMR records retrieved successfully',
        data: result.emrs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalRecords: result.totalRecords,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
      })
    } catch (error) {
      console.error('Error retrieving EMRs by user:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve EMR records',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Get all EMRs for a specific clinic
  getEmrsByClinicId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clinicId } = req.params
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

      if (!Types.ObjectId.isValid(clinicId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid clinic ID format',
        })
        return
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      }

      const result = await this.emrService.getEmrsByClinicId(clinicId, options)

      res.status(200).json({
        success: true,
        message: 'EMR records retrieved successfully',
        data: result.emrs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalRecords: result.totalRecords,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
      })
    } catch (error) {
      console.error('Error retrieving EMRs by clinic:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve EMR records',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Get all EMRs for a specific doctor
  getEmrsByDoctorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { doctorId } = req.params
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

      if (!Types.ObjectId.isValid(doctorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid doctor ID format',
        })
        return
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      }

      const result = await this.emrService.getEmrsByDoctorId(doctorId, options)

      res.status(200).json({
        success: true,
        message: 'EMR records retrieved successfully',
        data: result.emrs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalRecords: result.totalRecords,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
      })
    } catch (error) {
      console.error('Error retrieving EMRs by doctor:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve EMR records',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Update EMR record
  updateEmr = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const updateData = req.body

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid EMR ID format',
        })
        return
      }

      const updatedEmr = await this.emrService.updateEmr(id, updateData)

      if (!updatedEmr) {
        res.status(404).json({
          success: false,
          message: 'EMR record not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'EMR record updated successfully',
        data: updatedEmr,
      })
    } catch (error) {
      console.error('Error updating EMR:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update EMR record',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Delete EMR record
  deleteEmr = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid EMR ID format',
        })
        return
      }

      const deletedEmr = await this.emrService.deleteEmr(id)

      if (!deletedEmr) {
        res.status(404).json({
          success: false,
          message: 'EMR record not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'EMR record deleted successfully',
        data: deletedEmr,
      })
    } catch (error) {
      console.error('Error deleting EMR:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete EMR record',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Search EMRs
  searchEmrs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, searchBy = 'name', page = 1, limit = 10, clinicId, doctorId, startDate, endDate } = req.query

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        })
        return
      }

      const searchOptions = {
        query: query as string,
        searchBy: searchBy as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        clinicId: clinicId as string,
        doctorId: doctorId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      }

      const result = await this.emrService.searchEmrs(searchOptions)

      res.status(200).json({
        success: true,
        message: 'EMR records searched successfully',
        data: result.emrs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalRecords: result.totalRecords,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
      })
    } catch (error) {
      console.error('Error searching EMRs:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to search EMR records',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Add diagnosis to existing EMR
  addDiagnosis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const diagnosisData = req.body

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid EMR ID format',
        })
        return
      }

      const updatedEmr = await this.emrService.addDiagnosis(id, diagnosisData)

      if (!updatedEmr) {
        res.status(404).json({
          success: false,
          message: 'EMR record not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Diagnosis added successfully',
        data: updatedEmr,
      })
    } catch (error) {
      console.error('Error adding diagnosis:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to add diagnosis',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Add immunization to existing EMR
  addImmunization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const immunizationData = req.body

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid EMR ID format',
        })
        return
      }

      const updatedEmr = await this.emrService.addImmunization(id, immunizationData)

      if (!updatedEmr) {
        res.status(404).json({
          success: false,
          message: 'EMR record not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Immunization added successfully',
        data: updatedEmr,
      })
    } catch (error) {
      console.error('Error adding immunization:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to add immunization',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Get patient history summary
  getPatientHistorySummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params

      if (!Types.ObjectId.isValid(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID format',
        })
        return
      }

      const summary = await this.emrService.getPatientHistorySummary(userId)

      res.status(200).json({
        success: true,
        message: 'Patient history summary retrieved successfully',
        data: summary,
      })
    } catch (error) {
      console.error('Error retrieving patient history summary:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient history summary',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  generateEmrPdfAndUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      if (!id) {
        res.status(400).json({ success: false, message: 'EMR ID is required' })
        return
      }

      // 1. Fetch EMR from DB (populate doctor)
      const emr = await this.emrService.getEmrById(id)
      if (!emr) {
        res.status(404).json({ success: false, message: 'EMR not found' })
        return
      }

      // 2. Generate HTML
      const html = this.getEmrHTML(emr)

      // 3. Generate PDF using shared PDF generator
      const fileName = `emr_${id}_${Date.now()}.pdf`
      const s3Url = await PDFGenerator.generatePDF(html, fileName, {
        headerTemplate:
          '<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Electronic Medical Record</div>',
        footerTemplate:
          '<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">Page <span class="pageNumber"></span> of <span class="totalPages"></span><div> 2025 Preva Care</div></div>',
      })

      // 4. Save the S3 link to the EMR document
      await this.emrService.updateEmr(id, { emrPdfFileUrl: s3Url })

      // 5. Send WhatsApp message with regenerated PDF link
      try {
        // Get EMR details to find patient
        const emr = await this.emrService.getEmrById(id);
        if (emr) {
          const User = require('../../user/models/user.model').default;
          const DoctorMeta = require('../../doctor/models/doctor.model').default;

          const patient = await User.findById(emr.user);
          const doctorMeta = await DoctorMeta.findOne({ user_id: emr.doctor }).populate('user_id');

          if (patient && patient.phone) {
            const patientName = patient.name || 'Patient';
            const doctorName = doctorMeta?.user_id?.name || 'Doctor';

            await this.whatsappService.sendEmrPdfLink(
              patientName,
              doctorName,
              s3Url,
              patient.phone
            );
            console.log('✅ WhatsApp EMR regenerated PDF message sent successfully to:', patient.phone);
          } else {
            console.log('⚠️ No patient phone number available for WhatsApp notification');
          }
        }
      } catch (whatsappError) {
        console.error('❌ Error sending WhatsApp regenerated EMR PDF message:', whatsappError);
        // Don't fail the PDF regeneration if WhatsApp fails
      }

      // 6. Return the S3 link
      res.json({ success: true, url: s3Url })
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: 'Failed to generate/upload EMR PDF', error: err?.message || 'Unknown error' })
    }
  }

  private getEmrHTML(emrPdfData: any): string {
    const {
      basicInfo = {},
      doctor = {},
      history = {},
      immunization = [],
      generalPhysicalExamination = {},
      systemicExamination = {},
      diagnosis = [],
      advice = '',
      referrals = '',
      followUpSchedule = '',
      doctorNotes = '',
      consultationMode = '',
      createdAt = new Date(),
    } = emrPdfData || {}

    const formatDate = (date: any) => {
      return date ? dayjs(date).format('DD/MM/YYYY') : ''
    }

        const logoHtml = `<div style="background:#ffffff; padding:10px; border-radius:10px; font-weight:bold; color:#4b90e2; text-align:center;">
         <span style="font-size:1.5rem;">Preva Care</span>
       </div>`

    return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>EMR PDF</title>
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
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-info-row">
          <div class="doctor-info">
            <h2>Dr. ${(doctor?.name || doctor?.user_id?.name || '')}</h2>
            <p>
              ${Array.isArray(doctor?.specializations)
                  ? doctor.specializations.join(', ')
                  : (doctor?.specializations || doctor?.user_id?.specializations || '')}
            </p>
            <p>Reg. No: ${(doctor?.registrationNumber || doctor?.regNo || '')}</p>
            <p>Consultation Mode: ${consultationMode || ''}</p>
            <p>Date: ${formatDate(createdAt)}</p>
          </div>
        </div>
        <div class="logo">
          <img src="${emrPdfData?.clinic?.logo}" alt="Clinic Logo" style="max-height:40px; background-color:#ffffff; padding:10px; border-radius:10px;" />
          <div class="logo-address">${emrPdfData?.clinic?.address || ''}</div>
        </div>
      </div>

      <h1 class="title">Electronic Medical Record</h1>

      <div class="container-fluid px-4">
        <!-- Patient Info -->
        <div class="section-container">
          <h4 class="section-title">Patient Information</h4>
          <div class="table-container">
            <table>
              <tbody>
                <tr><th>Patient Name</th><td>${basicInfo.name || ''}</td></tr>
                <tr><th>Age</th><td>${basicInfo.age || ''} years</td></tr>
                <tr><th>Gender</th><td>${basicInfo.gender === 'F' ? 'Female' : 'Male'}</td></tr>
                <tr><th>Phone Number</th><td>${basicInfo.phoneNumber || ''}</td></tr>
                <tr><th>Blood Group</th><td>${basicInfo.bloodGroup || ''}</td></tr>
                <tr><th>Marital Status</th><td>${basicInfo.maritalStatus ? 'Married' : 'Single'}</td></tr>
                <tr><th>Children</th><td>${basicInfo.children || '0'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- History -->
        <div class="section-container">
          <h4 class="section-title">Medical History</h4>
          <div class="table-container">
            <table>
              <tbody>
                <tr><th>Chief Complaint</th><td>${history.chiefComplaint || ''}</td></tr>
                <tr><th>History of Present Illness</th><td>${history.historyOfPresentingIllness || ''}</td></tr>
                <tr><th>Previous Surgeries</th><td>${history.previousSurgeries || ''}</td></tr>
                <tr><th>Bowel and Bladder</th><td>${history.bowelAndBladder || ''}</td></tr>
                <tr><th>Appetite</th><td>${history.appetite || ''}</td></tr>
                <tr><th>Sleep</th><td>${history.sleep || ''} hours</td></tr>
                <tr><th>Mental Health Assessment</th><td>${history.mentalHealthAssessment || ''}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Habits -->
        <div class="section-container">
          <h4 class="section-title">Habits</h4>
          <div class="table-container">
            <table>
              <tbody>
                <tr><th>Smoking</th><td>${history.habits?.smoking ? 'Yes' : 'No'}</td></tr>
                <tr><th>Alcohol</th><td>${history.habits?.alcohol ? 'Yes' : 'No'}</td></tr>
                ${
                  history.habits?.alcohol
                    ? `
                <tr><th>Alcohol Details</th><td>${history.habits?.alcoholDetails || ''}</td></tr>
                <tr><th>Quantity per Week</th><td>${history.habits?.qntPerWeek || ''} ml</td></tr>
                `
                    : ''
                }
                <tr><th>Substance Abuse</th><td>${history.habits?.substanceAbuse || 'None'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Past History -->
        ${
          history.pastHistory && history.pastHistory.length > 0
            ? `
          <div class="section-container">
            <h4 class="section-title">Past Medical History</h4>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Condition</th>
                    <th>Medications</th>
                    <th>Frequency</th>
                    <th>Readings</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.pastHistory
                    .map(
                      (ph: any) => `
                    <tr>
                      <td>${ph.sufferingFrom || ''}</td>
                      <td>${ph.drugName?.join(', ') || ''}</td>
                      <td>${ph.freequency?.join(', ') || ''}</td>
                      <td>${ph.readings || ''}</td>
                      <td>${ph.pastHistoryNotes || ''}</td>
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        `
            : ''
        }

        <!-- Surgical History -->
        ${
          history.surgicalHistory && history.surgicalHistory.length > 0
            ? `
          <div class="section-container">
            <h4 class="section-title">Surgical History</h4>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Surgery</th>
                    <th>Indication</th>
                    <th>Year</th>
                    <th>Procedure</th>
                    <th>Complications</th>
                    <th>Hospital</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.surgicalHistory
                    .map(
                      (sh: any) => `
                    <tr>
                      <td>${sh.surgeryName || ''}</td>
                      <td>${sh.indication || ''}</td>
                      <td>${sh.year || ''}</td>
                      <td>${sh.procedureType || ''}</td>
                      <td>${sh.complications || ''}</td>
                      <td>${sh.hospital?.name || ''}, ${sh.hospital?.location || ''}</td>
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        `
            : ''
        }

        <!-- Allergies -->
        ${
          history.allergies && history.allergies.length > 0
            ? `
          <div class="section-container">
            <h4 class="section-title">Allergies</h4>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Allergy</th>
                    <th>Past Medications</th>
                    <th>Frequency</th>
                    <th>Advised By</th>
                    <th>Advice</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.allergies
                    .map(
                      (allergy: any) => `
                    <tr>
                      <td>${allergy.allergyName || ''}</td>
                      <td>${allergy.pastAllergyDrugName?.join(', ') || ''}</td>
                      <td>${allergy.pastAllergyFreequency?.join(', ') || ''}</td>
                      <td>${allergy.advisedBy || ''}</td>
                      <td>${allergy.advise || ''}</td>
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        `
            : ''
        }

        <!-- Immunization -->
        ${
          immunization && immunization.length > 0
            ? `
          <div class="section-container">
            <h4 class="section-title">Immunization History</h4>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Vaccine</th>
                    <th>Total Doses</th>
                    <th>Doctor</th>
                    <th>Side Effects</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${immunization
                    .map(
                      (imm: any) => `
                    <tr>
                      <td>${imm.immunizationType || ''}</td>
                      <td>${imm.vaccinationName || ''}</td>
                      <td>${imm.totalDose || ''}</td>
                      <td>${imm.doctorName || ''}</td>
                      <td>${imm.sideEffects || ''}</td>
                      <td>${imm.immunizationNotes || ''}</td>
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        `
            : ''
        }

        <!-- General Physical Examination -->
        <div class="section-container">
          <h4 class="section-title">General Physical Examination${consultationMode === 'online' ? '<i>as per patient</i>' : ''}</h4>
          <div class="table-container">
            <table>
              <tbody>
                <tr><th>Blood Pressure</th><td>${
                  generalPhysicalExamination.BP?.sys || ''
                }/${generalPhysicalExamination.BP?.dia || ''} mmHg</td></tr>
                <tr><th>Pulse Rate</th><td>${generalPhysicalExamination.PR || ''} bpm</td></tr>
                <tr><th>Volume</th><td>${generalPhysicalExamination.volume || ''}</td></tr>
                <tr><th>Regularity</th><td>${generalPhysicalExamination.regularity || ''}</td></tr>
                <tr><th>Character</th><td>${generalPhysicalExamination.character || ''}</td></tr>
                <tr><th>Temperature</th><td>${generalPhysicalExamination.temperature || ''}</td></tr>
                <tr><th>Respiratory Rate</th><td>${generalPhysicalExamination.RR || ''}</td></tr>
                <tr><th>SpO2</th><td>${generalPhysicalExamination.SPO2 || ''}%</td></tr>
                <tr><th>Height</th><td>${generalPhysicalExamination.height || ''} m</td></tr>
                <tr><th>Weight</th><td>${generalPhysicalExamination.weight || ''} kg</td></tr>
                <tr><th>BMI</th><td>${generalPhysicalExamination.BMI || ''}</td></tr>
                <tr><th>Radio Femoral Delay</th><td>${generalPhysicalExamination.radioFemoralDelay || ''}</td></tr>
                <tr><th>Pallor</th><td>${generalPhysicalExamination.pallor || ''}</td></tr>
                <tr><th>Icterus</th><td>${generalPhysicalExamination.icterus || ''}</td></tr>
                <tr><th>Cyanosis</th><td>${generalPhysicalExamination.cyanosis || ''}</td></tr>
                <tr><th>Clubbing</th><td>${generalPhysicalExamination.clubbing || ''}</td></tr>
                <tr><th>Lymphadenopathy</th><td>${generalPhysicalExamination.lymphadenopathy || ''}</td></tr>
                <tr><th>Edema</th><td>${generalPhysicalExamination.edema || ''}</td></tr>
                <tr><th>JVP</th><td>${generalPhysicalExamination.JVP || ''}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Systemic Examination -->
        <div class="section-container">
          <h4 class="section-title">Systemic Examination</h4>
          <div class="table-container">
            <table>
              <tbody>
                <tr><th>Respiratory System</th><td>${systemicExamination.respiratorySystem || ''}</td></tr>
                <tr><th>Cardiovascular System</th><td>${systemicExamination.CVS || ''}</td></tr>
                <tr><th>Central Nervous System</th><td>${systemicExamination.CNS || ''}</td></tr>
                <tr><th>Per Abdomen</th><td>${systemicExamination.PA || ''}</td></tr>
                <tr><th>Other Findings</th><td>${systemicExamination.otherSystemicFindings || ''}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Diagnosis and Prescription -->
        ${
          diagnosis && diagnosis.length > 0
            ? `
          <div class="section-container">
            <h4 class="section-title">Diagnosis & Prescription</h4>
            ${diagnosis
              .map(
                (diag: any) => `
              <div class="table-container">
                <table>
                  <tbody>
                    <tr>
                      <th style="width: 30%">Diagnosis</th>
                      <td>${diag.diagnosisName || ''}</td>
                    </tr>
                    <tr>
                      <th>Date</th>
                      <td>${formatDate(diag.dateOfDiagnosis)}</td>
                    </tr>
                  </tbody>
                </table>
                ${
                  diag.prescription && diag.prescription.length > 0
                    ? `
                  <table style="margin-top: 10px;">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Route</th>
                        <th>How to Take</th>
                        <th>Investigations</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${diag.prescription
                        .map(
                          (med: any) => `
                        <tr>
                          <td>${med.drugName || ''}</td>
                          <td>${med.frequency || ''}</td>
                          <td>${med.duration || ''} days</td>
                          <td>${med.routeOfAdministration || ''}</td>
                          <td>${med.howToTake || ''}</td>
                          <td>${med.investigations || ''}</td>
                        </tr>
                      `,
                        )
                        .join('')}
                    </tbody>
                  </table>
                `
                    : ''
                }
              </div>
            `,
              )
              .join('')}
          </div>
        `
            : ''
        }

        <!-- Advice and Follow-up -->
        <div class="section-container">
          <h4 class="section-title">Advice & Follow-up</h4>
          <div class="table-container">
            <table>
              <tbody>
                <tr><th>Advice</th><td>${advice || ''}</td></tr>
                <tr><th>Referrals</th><td>${referrals || ''}</td></tr>
                <tr><th>Follow-up Schedule</th><td>${followUpSchedule || ''}</td></tr>
                ${doctorNotes ? `<tr><th>Doctor Notes</th><td>${doctorNotes}</td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="footer">
        <span> 2025 Preva Care | Electronic Medical Record System</span>
      </div>
    </body>
  </html>
  `
  }

  // new
}
