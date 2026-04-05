import mongoose from 'mongoose'

enum StatusType {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
enum Type {
  INDIVIDUAL = 'individual',
  ORGANIZATION = 'organization',
}

const availableLocationSchema = new mongoose.Schema({
  place: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  googleMapUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: StatusType,
    default: StatusType.ACTIVE,
  },
  membership: {
    type: String,
  },
})

const ClinicSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    availableLocations: {
      type: [availableLocationSchema],
    },
    website: {
      type: String,
    },
    ownerName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: StatusType,
      default: StatusType.ACTIVE,
    },
    type:{
      type: String,
      enum: Type,
    },
    eSign: {
      type: String,
    },
    membership: {
      type: String,
    },
    haveCustomMembership: {
      type: Boolean,
      default: false,
    },
    googleFormLink: {
      type: String,
    },
    panNumber: {
      type: String,
      trim: true
    },
    gstNumber: {
      type: String,
      trim: true
    },
  },
  {
    timestamps: true,
  },
)

const Clinic = mongoose.model('Clinic', ClinicSchema)

export default Clinic
export { StatusType }
