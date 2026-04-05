import { Request, Response } from 'express';
import ConsentService from '../services/consent.service';
import { AuthenticatedRequest } from '../../../types';

class ConsentController {

  async createConsentForm(req: AuthenticatedRequest, res: Response) {
    const clinicId = req.currentUser?.clinic;
    const response = {...req.body,clinicId}
    try {
      const form = await ConsentService.createConsentForm(response);
      res.status(201).json({ success: true, data: form });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create consent form' });
    }
  }

  async signConsentForm(req: AuthenticatedRequest, res: Response) {
    try {
      const { formId } = req.params;
      const user = req.currentUser;

      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      // Get the S3 file location from the request (added by middleware)
      const signatureImage = (req.file as any)?.location;
      if (!signatureImage) {
        res.status(400).json({ success: false, message: 'Signature image is required.' });
        return;
      }

      const updatedForm = await ConsentService.signConsentForm(formId, {
        signatureImage,
        signedAt: new Date(),
      });

      res.status(200).json({ success: true, data: updatedForm, message: 'Consent signed successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to sign consent form.' });
    }
  }

  async getConsentForms(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.currentUser;
      // console.log(user)

      if (!user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return ;
      }

      let forms;
      if (user.roles.includes('doctor') || user.roles.includes('hybrid')) {
        forms = await ConsentService.getConsentFormsByDoctor(user._id.toString());
      } else if (user.roles.includes('patient')) {
        forms = await ConsentService.getConsentFormsByPatient(user._id.toString());
      }
      else if (user.roles.includes('admin')){
        if (!user.clinic || !user.clinic._id) {
          res.status(400).json({ success: false, message: 'Admin user has no clinic assigned.' });
          return;
        }
        forms = await ConsentService.getConsentFormsByClinic(user.clinic._id.toString());
      }
      // console.log(forms)
      res.status(200).json({ success: true, data: forms });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch consent forms' });
    }
  }

  async getConsentFormById(req: Request, res: Response) {
    try {
      const form = await ConsentService.getConsentFormById(req.params.id);
      if (!form) {
        res.status(404).json({ success: false, message: 'Form not found' });
        return;
      }
      res.status(200).json({ success: true, data: form });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch consent form' });
    }
  }

  async generateConsentPdf(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pdfBuffer = await ConsentService.generateConsentPdf(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="consent-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating consent PDF:', error);
      res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
  }
}

export default new ConsentController();
