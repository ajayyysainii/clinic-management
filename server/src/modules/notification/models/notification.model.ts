import mongoose, { Document, Schema } from 'mongoose'

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  clinicId?: mongoose.Types.ObjectId
  title: string
  message: string
  type: string // 'appointment', 'system', 'billing', 'consent', etc.
  relatedId?: mongoose.Types.ObjectId // Optional reference to related entity (appointment, invoice, etc.)
  metadata?: Record<string, any> // Flexible field for additional data
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: false },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true, default: 'system' },
    relatedId: { type: Schema.Types.ObjectId, required: false },
    metadata: { type: Schema.Types.Mixed, required: false },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)
