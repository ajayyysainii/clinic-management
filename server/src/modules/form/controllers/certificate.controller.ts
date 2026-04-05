import { Request, Response } from 'express';
import { CertificateService } from '../services/certificate.service';
import { AuthenticatedRequest } from '../../../types';
import { CertificateType } from '../models/certificate.model';

export class CertificateController {
  private certificateService: CertificateService;

  constructor() {
    this.certificateService = new CertificateService();
  }

  async createCertificate(req: AuthenticatedRequest, res: Response) {
    try {
      const clinicId = req.currentUser?.clinic;
      const doctorId = req.currentUser?._id;

      if (!clinicId) {
        res.status(400).json({ error: 'Clinic information is required' });
        return;
      }

      if (!doctorId) {
        res.status(400).json({ error: 'Doctor information is required' });
        return;
      }

      const certificateData = {
        ...req.body,
        clinicId,
        doctorId,
        certificateType: req.body.certificateType as CertificateType,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        examinationDate: req.body.examinationDate ? new Date(req.body.examinationDate) : undefined,
        issuedDate: req.body.issuedDate ? new Date(req.body.issuedDate) : new Date(),
      };

      const certificate = await this.certificateService.createCertificate(certificateData);
      res.status(201).json({ success: true, data: certificate });
    } catch (error: any) {
      console.error('Certificate creation error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getCertificates(req: Request, res: Response) {
    try {
      const filter = req.query || {};
      const certificates = await this.certificateService.getCertificates(filter);
      res.json({ success: true, data: certificates });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCertificateById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const certificate = await this.certificateService.getCertificateById(id);
      if (!certificate) {
        res.status(404).json({ error: 'Certificate not found' });
        return;
      }
      res.json({ success: true, data: certificate });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateCertificate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await this.certificateService.updateCertificate(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Certificate not found' });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCertificate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.certificateService.deleteCertificate(id);
      if (!deleted) {
        res.status(404).json({ error: 'Certificate not found' });
        return;
      }
      res.json({ success: true, message: 'Certificate deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCertificatesByRole(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.currentUser;
      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      let certificates;

      // Handle different roles
      if (user.roles.includes('doctor') || user.roles.includes('hybrid')) {
        certificates = await this.certificateService.getCertificatesByDoctor(user._id.toString());
      } else if (user.roles.includes('patient')) {
        certificates = await this.certificateService.getCertificatesByPatient(user._id.toString());
      } else if (user.roles.includes('admin') || user.roles.includes('clinic-admin') || user.roles.includes('clinic-head') || user.roles.includes('hybrid')) {
        // Admin, clinic-admin, clinic-head, and hybrid can see all certificates for their clinic
        if (!user.clinic || !user.clinic._id) {
          res.status(400).json({ success: false, message: 'User has no clinic assigned.' });
          return;
        }
        certificates = await this.certificateService.getCertificatesByClinic(user.clinic._id.toString());
      } else if (user.roles.includes('staff')) {
        // Staff can see all certificates for their clinic
        if (!user.clinic || !user.clinic._id) {
          res.status(400).json({ success: false, message: 'Staff user has no clinic assigned.' });
          return;
        }
        certificates = await this.certificateService.getCertificatesByClinic(user.clinic._id.toString());
      } else {
        res.status(403).json({ success: false, message: 'Unauthorized role.' });
        return;
      }

      res.status(200).json({ success: true, data: certificates });
    } catch (error: any) {
      console.error('Error in getCertificatesByRole:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
    }
  }

  async downloadCertificate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const certificate = await this.certificateService.getCertificateById(id);

      if (!certificate) {
        res.status(404).json({ error: 'Certificate not found' });
        return;
      }

      if (!certificate.pdfUrl) {
        res.status(404).json({ error: 'PDF not available for this certificate' });
        return;
      }

      // Redirect to the PDF URL or return the URL for frontend to handle
      res.json({
        success: true,
        data: {
          pdfUrl: certificate.pdfUrl,
          certificateType: certificate.certificateType,
          patientName: certificate.patientName
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
