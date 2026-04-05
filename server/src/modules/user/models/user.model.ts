import mongoose, { Document, Schema } from 'mongoose'
import { RoleType, Role } from '../types'

// Add Gender and BloodGroup enums/types
export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}
export enum BloodGroup {
  APositive = 'A+',
  ANegative = 'A-',
  BPositive = 'B+',
  BNegative = 'B-',
  ABPositive = 'AB+',
  ABNegative = 'AB-',
  OPositive = 'O+',
  ONegative = 'O-',
  NotKnown = "Not Known"
}


interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  profileImageUrl: string
  name: string
  email: string
  phone: string
  password: string
  roles: RoleType[]
  clinic?: mongoose.Types.ObjectId
  deletedAt: string
  gender?: Gender
  bloodGroup?: BloodGroup
}

const userSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    profileImageUrl: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: [String],
      enum: Role,
      required: true,
    },
    clinic: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: false,
    },
    gender: {
      type: String,
      enum: Gender,
      required: false,
    },
    bloodGroup: {
      type: String,
      enum: BloodGroup,
      required: false,
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
)

const User = mongoose.model<IUser>('User', userSchema)

export default User
export { IUser }


