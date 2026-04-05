import { Request, Response } from 'express';
import { StaffPayoutConfig } from '../models/staffPayoutConfig.model';
import AuthenticatedRequest from '../../../../types/AuthenticatedRequest';
import { StaffBillingService } from '../services/staffBilling.service';

export class StaffBillingController {
  // Example method
  public async exampleMethod(req: Request, res: Response): Promise<void> {
    res.json({ message: 'Staff billing controller working!' });
  }

  public async createStaffPayoutConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { staff_id } = req.params;
      const clinic_id = req.currentUser?.clinic;
      if (!clinic_id) {
        res.status(400).json({ error: 'Clinic ID not found in user context.' });
        return;
      }
      if (!staff_id) {
        res.status(400).json({ error: 'Staff ID is required in params.' });
        return;
      }
      const data = {
        ...req.body,
        staff_id,
        clinic_id,
      };
      const config = await StaffPayoutConfig.create(data);
      res.status(201).json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create staff payout config', details: error instanceof Error ? error.message : error });
    }
  }

  public async listStaffPayoutConfigs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserClinic = req.currentUser?.clinic;

      if (!currentUserClinic) {
        res.status(400).json({
          success: false,
          error: 'User is not associated with any clinic'
        });
        return;
      }

      const service = new StaffBillingService();
      const configs = await service.listStaffPayoutConfigs(currentUserClinic);
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch staff payout configs', details: error instanceof Error ? error.message : error });
    }
  }
}
