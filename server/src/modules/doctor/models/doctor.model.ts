import mongoose, { Document, Schema } from 'mongoose'

export interface ISlot {
  startTime: string
  endTime: string
}

export interface IAvailability {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  slots: ISlot[]
}

export interface ICertificates {
  title: string
  certificates_image_url: string
}
export interface IDegrees {
  title: string
  degrees_image_url: string
}

export interface IDoctorMeta extends Document {
  user_id: mongoose.Types.ObjectId
  bio: string
  yearsOfExperience: number
  eSign: string
  degrees: IDegrees[]
  certificates: ICertificates[]
  specializations: string[]
  availability: IAvailability[]
  createdAt: Date
  updatedAt: Date
}

const SlotSchema = new Schema<ISlot>({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
})

const AvailabilitySchema = new Schema<IAvailability>({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  slots: [SlotSchema],
})

const CertificatesSchema = new Schema<ICertificates>({
  title: String,
  certificates_image_url: String,
})

const DegreesSchema = new Schema<IDegrees>({
  title: String,
  degrees_image_url: String,
})

const DoctorMetaSchema = new Schema<IDoctorMeta>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bio: {
      type: String,
      required: false,
    },
    yearsOfExperience: {
      type: Number,
      required: false,
    },
    eSign: {
      type: String,
      required: false,
    },
    degrees: [DegreesSchema],
    certificates: [CertificatesSchema],
    specializations: {
      type: [String],
      required: false,
    },
    availability: [AvailabilitySchema],
  },
  { timestamps: true },
)

const DoctorMeta = mongoose.model<IDoctorMeta>('DoctorMeta', DoctorMetaSchema)
export default DoctorMeta
