import { UserRepository } from '../repository'
import { comparePassword, hashPassword } from '../../../utils/password'
import { getJwtToken } from '../../../utils/token'
import { RoleType } from '../types'

export class UserService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  async login(email: string, password: string) {
    // Find user by email
    const user = await this.userRepository.findUserByEmail(email)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = getJwtToken({
      email: user.email,
      userId: user._id.toString(),
      roles: user.roles
    });

    return {token};
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Find user by ID
    const user = await this.userRepository.findUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update user password
    await this.userRepository.updateUserPassword(userId, hashedNewPassword)

    return { message: 'Password changed successfully' }
  }

    async updateProfile(userId: string, updateData: { name?: string; email?: string; phone?: string; profileImageUrl?: string }) {
    // Find user by ID
    const user = await this.userRepository.findUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Validate email uniqueness if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findUserByEmail(updateData.email)
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error('Email already exists')
      }
    }

    // Update user profile
    const updatedUser = await this.userRepository.updateUserProfile(userId, updateData)

    return updatedUser
  }

  async updateProfileImage(userId: string, profileImageUrl: string) {
    // Find user by ID
    const user = await this.userRepository.findUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Update user profile image
    const updatedUser = await this.userRepository.updateUserProfile(userId, { profileImageUrl })

    return updatedUser
  }

  async createUser(userData: {
    name: string
    email: string
    password: string
    roles: RoleType[]
    phone?: string
    clinic?: string
  }) {
    // Check if user already exists
    const existingUser = await this.userRepository.findUserByEmail(userData.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash the password
    const hashedPassword = await hashPassword(userData.password)

    // Create user
    const user = await this.userRepository.createUser({
      ...userData,
      password: hashedPassword
    })

    // Remove password from response
    const { password, ...userWithoutPassword } = user.toObject()

    return userWithoutPassword
  }
}
