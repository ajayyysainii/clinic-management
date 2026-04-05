import { User, IUser } from '../models'
import { RoleType } from '../types'
import mongoose from 'mongoose'

export class UserRepository {
  async findUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).populate('clinic');
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId).populate('clinic');
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
  }

    async updateUserProfile(userId: string, updateData: { name?: string; email?: string; phone?: string; profileImageUrl?: string }): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: '-password' }
    ).populate('clinic');
  }

  async createUser(userData: {
    name: string
    email: string
    password: string
    roles: RoleType[]
    phone?: string
    clinic?: string
  }): Promise<IUser> {
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      roles: userData.roles,
      phone: userData.phone,
      clinic: userData.clinic ? new mongoose.Types.ObjectId(userData.clinic) : undefined
    });
    return await user.save();
  }
}
