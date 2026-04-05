import StaffMeta, { IStaffMeta } from '../models/staffMeta.model'
import mongoose, {Types} from 'mongoose'
import { User } from '../../user/models'
import { hashPassword, randomPassword } from '../../../utils/password'
import { sendEmail } from '../../../utils/emailClient'


export class StaffService {
  async createStaff(data: any): Promise<IStaffMeta> {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const { name, email, phone, clinic, gender, bloodGroup, eSign, degrees } = data as any
      if (!name || !email || !phone) {
        throw new Error('Name, email, and phone are required.')
      }
      const tempPassword = randomPassword()
      const hashedPassword = await hashPassword(tempPassword)
      const user = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        roles: ['staff'],
        clinic,
        gender,
        bloodGroup,
        profileImageUrl: data.profileImageUrl || '',
      })
      await user.save({ session })
      const staffMeta = new StaffMeta({
        user_id: user._id,
        eSign,
        degrees,
      })
      await staffMeta.save({ session })
      const subject = 'Welcome to PrevaCare - Your Staff Account'
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Staff Registration Success</title></head>
        <body>
          <p>Welcome to PrevaCare!<br><br>
          Your staff account has been created successfully.<br><br>
          Login credentials:<br>
          Email: ${user.email}<br>
          Password: ${tempPassword}<br><br>
          Please change your password after first login.</p>
        </body>
        </html>`
      await sendEmail(process.env.ADMIN_EMAIL!, user.email, subject, html)
      await session.commitTransaction()
      session.endSession()
      return staffMeta
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  }

  async getStaffById(id: string): Promise<IStaffMeta | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    return StaffMeta.findById(id)
  }

  async getAllStaff(clinicId?: Types.ObjectId): Promise<IStaffMeta[]> {
    if (!clinicId) return [];
    // Find all users with role 'staff' and matching clinic
    const users = await User.find({ roles: 'staff', clinic: clinicId, deletedAt: null });
    const userIds = users.map(u => u._id);
    return StaffMeta.find({ user_id: { $in: userIds } }).populate('user_id');
  }

  async updateStaff(id: string, updateData: Partial<IStaffMeta>): Promise<IStaffMeta | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    return StaffMeta.findByIdAndUpdate(id, updateData, { new: true })
  }

  async deleteStaff(id: string): Promise<IStaffMeta | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    const staffMeta = await StaffMeta.findById(id)
    if (!staffMeta) return null
    // Soft delete the associated user
    await User.findByIdAndUpdate(staffMeta.user_id, { deletedAt: new Date() })
    return staffMeta
  }
}

export default StaffService
