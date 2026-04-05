import mongoose, { Document, Schema } from 'mongoose'

export interface IDegree {
  name?: string
  image_url?: string
}

export interface IStaffMeta extends Document {
  user_id: mongoose.Types.ObjectId
  eSign: string // S3 link
  degrees?: IDegree[]
  createdAt: Date
  updatedAt: Date
}

const DegreeSchema = new Schema<IDegree>({
  name: { type: String, required: false },
  image_url: { type: String, required: false },
})

const StaffMetaSchema = new Schema<IStaffMeta>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eSign: {
      type: String,
      required: false,
    },
    degrees: [DegreeSchema],
  },
  { timestamps: true },
)

const StaffMeta = mongoose.model<IStaffMeta>('StaffMeta', StaffMetaSchema)
export default StaffMeta
