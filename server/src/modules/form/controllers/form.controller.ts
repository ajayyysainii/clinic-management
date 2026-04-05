import { Request, Response } from 'express';
import { FormService } from '../services/form.service';
import { GstClinicInvoice } from '../models/gstClinic.model';
import Invoice from '../../billing/patient/models/invoice.model';
import { AuthenticatedRequest } from '../../../types';

export class FormController {
  private formService: FormService;

  constructor() {
    this.formService = new FormService();
  }

  async createGstForm(req: Request, res: Response) {
    try {
      const { invoice_id } = req.params;
      if (!invoice_id) {
        res.status(400).json({ error: 'invoice_id is required' });
        return ;
      }
      const gstForm = await this.formService.createGstForm(invoice_id);
      res.status(201).json(gstForm);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getGstClinicInvoicesByClinicId(req: AuthenticatedRequest, res: Response) {
    try {
      const clinicId = req.currentUser?.clinic;
      if (!clinicId) {
        res.status(400).json({ error: 'clinicId is required' });
        return;
      }
      // Find all invoices for this clinic
      const invoiceIds = await Invoice.find({ clinic_id: clinicId }).distinct('_id');
      const gstClinicInvoices = await GstClinicInvoice.find({ invoice_id: { $in: invoiceIds } });
      res.json({ success: true, data: gstClinicInvoices });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createReferralForm(req: AuthenticatedRequest, res: Response) {

    try {
      const clinicId = req.currentUser?.clinic;
      const response = {...req.body,clinicId}
      const referralForm = await this.formService.createReferralForm(response);
      res.status(201).json(referralForm);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getReferralForms(req: Request, res: Response) {
    try {
      const filter = req.query || {};
      const referralForms = await this.formService.getReferralForms(filter);
      res.json(referralForms);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getReferralFormById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const referralForm = await this.formService.getReferralFormById(id);
      if (!referralForm) {
        res.status(404).json({ error: 'Referral form not found' });
        return;
      }
      res.json(referralForm);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateReferralForm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await this.formService.updateReferralForm(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Referral form not found' });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteReferralForm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.formService.deleteReferralForm(id);
      if (!deleted) {
        res.status(404).json({ error: 'Referral form not found' });
        return;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getReferralFormsByRole(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.currentUser;
      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      // Debug logging
      console.log('User roles:', user.roles);
      console.log('User clinic:', user.clinic);

      let forms;

      // Handle different roles
      if (user.roles.includes('doctor') || user.roles.includes('hybrid')) {
        // Doctor can see their own referrals
        forms = await this.formService.getReferralFormsByDoctor(user._id.toString());
      } else if (user.roles.includes('patient')) {
        // Patient can see referrals where they are the patient
        forms = await this.formService.getReferralFormsByPatient(user._id.toString());
      } else if (user.roles.includes('admin') || user.roles.includes('clinic-admin') || user.roles.includes('clinic-head')) {
        // Admin, clinic-admin, clinic-head can see all referrals for their clinic
        if (!user.clinic || !user.clinic._id) {
          res.status(400).json({ success: false, message: 'User has no clinic assigned.' });
          return;
        }
        forms = await this.formService.getReferralFormsByClinic(user.clinic._id.toString());
      } else if (user.roles.includes('staff')) {
        // Staff can see all referrals for their clinic
        if (!user.clinic || !user.clinic._id) {
          res.status(400).json({ success: false, message: 'Staff user has no clinic assigned.' });
          return;
        }
        forms = await this.formService.getReferralFormsByClinic(user.clinic._id.toString());
      } else {
        res.status(403).json({ success: false, message: 'Unauthorized role.' });
        return;
      }

      res.status(200).json({ success: true, data: forms });
    } catch (error: any) {
      console.error('Error in getReferralFormsByRole:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch referral forms' });
    }
  }
}
