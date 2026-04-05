import { StaffPayoutConfig } from '../models/staffPayoutConfig.model';
import { Types } from 'mongoose';

export class StaffBillingService {
  // Example service method
  public async exampleServiceMethod(): Promise<string> {
    return 'Staff billing service working!';
  }

  public async listStaffPayoutConfigs(clinicId: Types.ObjectId): Promise<any[]> {
    return await StaffPayoutConfig.find({ clinic_id: clinicId })
      .populate({
        path: 'staff_id',
        populate: { path: 'user_id' }
      })
      .populate('clinic_id');
  }
}
