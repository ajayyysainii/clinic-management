// services/notification.service.ts
import { Notification } from '../models'
import mongoose from 'mongoose'

export class NotificationService {
  async getNotificationsByUserId(userId: string, readStatus?: boolean) {
    // Validate the userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid User ID')
    }

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    }

    // Add read status filter if provided
    if (readStatus !== undefined) {
      query.isRead = readStatus
    }

    return Notification.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .exec()
  }

  async markNotificationsAsRead(userId: string, notificationIds?: string[]) {
    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    }

    if (notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds }
    }

    return Notification.updateMany(query, { $set: { isRead: true } }, { new: true }).exec()
  }

  async markClinicNotificationsAsRead(clinicId: string, notificationIds?: string[]) {
    console.log('🔍 markClinicNotificationsAsRead - Starting with clinicId:', clinicId)
    console.log('🔍 markClinicNotificationsAsRead - notificationIds:', notificationIds)

    // Validate the clinicId
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      console.error('❌ markClinicNotificationsAsRead - Invalid Clinic ID:', clinicId)
      throw new Error('Invalid Clinic ID')
    }

    const query: any = {
      clinicId: new mongoose.Types.ObjectId(clinicId),
      isRead: false,
    }

    if (notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds }
    }

    console.log('🔍 markClinicNotificationsAsRead - Query:', JSON.stringify(query, null, 2))

    try {
      const result = await Notification.updateMany(query, { $set: { isRead: true } }, { new: true }).exec()
      console.log('✅ markClinicNotificationsAsRead - Successfully marked notifications as read:', result)
      return result
    } catch (error) {
      console.error('❌ markClinicNotificationsAsRead - Error marking notifications as read:', error)
      throw error
    }
  }

  async createNotification(notificationData: {
    userId: string
    clinicId?: string
    title: string
    message: string
    type?: string
    relatedId?: string
    metadata?: Record<string, any>
  }) {
    try {
      console.log('🔍 createNotification - Starting with data:', notificationData)

      // Validate the userId
      if (!mongoose.Types.ObjectId.isValid(notificationData.userId)) {
        console.error('❌ createNotification - Invalid User ID:', notificationData.userId)
        throw new Error('Invalid User ID')
      }

      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(notificationData.userId),
        clinicId: notificationData.clinicId ? new mongoose.Types.ObjectId(notificationData.clinicId) : undefined,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'system',
        relatedId: notificationData.relatedId ? new mongoose.Types.ObjectId(notificationData.relatedId) : undefined,
        metadata: notificationData.metadata,
      })

      console.log('🔍 createNotification - Created notification object:', notification)

      const savedNotification = await notification.save()
      console.log('✅ createNotification - Successfully saved notification:', savedNotification._id)

      return savedNotification
    } catch (error: any) {
      console.error('❌ createNotification - Error saving notification:', error)
      console.error('❌ createNotification - Error details:', {
        message: error.message,
        stack: error.stack,
        notificationData: notificationData
      })
      throw error
    }
  }

  async createBulkNotifications(notificationsData: Array<{
    userId: string
    clinicId?: string
    title: string
    message: string
    type?: string
    relatedId?: string
    metadata?: Record<string, any>
  }>) {
    try {
      console.log('🔍 createBulkNotifications - Starting with data count:', notificationsData.length)
      console.log('🔍 createBulkNotifications - First notification sample:', notificationsData[0])

      const notifications = notificationsData.map(data => ({
        userId: new mongoose.Types.ObjectId(data.userId),
        clinicId: data.clinicId ? new mongoose.Types.ObjectId(data.clinicId) : undefined,
        title: data.title,
        message: data.message,
        type: data.type || 'system',
        relatedId: data.relatedId ? new mongoose.Types.ObjectId(data.relatedId) : undefined,
        metadata: data.metadata,
      }))

      console.log('🔍 createBulkNotifications - Mapped notifications count:', notifications.length)

      const result = await Notification.insertMany(notifications)
      console.log('✅ createBulkNotifications - Successfully saved notifications:', result.length)

      return result
    } catch (error: any) {
      console.error('❌ createBulkNotifications - Error saving notifications:', error)
      console.error('❌ createBulkNotifications - Error details:', {
        message: error.message,
        stack: error.stack,
        notificationsDataCount: notificationsData.length
      })
      throw error
    }
  }

  async deleteNotification(notificationId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid Notification ID')
    }

    return Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec()
  }

  async getUnreadCount(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid User ID')
    }

    return Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    }).exec()
  }

  async getNotificationsByClinicId(clinicId: string, readStatus?: boolean) {
    console.log('🔍 getNotificationsByClinicId - Starting with clinicId:', clinicId)
    console.log('🔍 getNotificationsByClinicId - readStatus:', readStatus)

    // Validate the clinicId
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      console.error('❌ getNotificationsByClinicId - Invalid Clinic ID:', clinicId)
      throw new Error('Invalid Clinic ID')
    }

    const query: any = {
      clinicId: new mongoose.Types.ObjectId(clinicId),
    }

    // Add read status filter if provided
    if (readStatus !== undefined) {
      query.isRead = readStatus
    }

    console.log('🔍 getNotificationsByClinicId - Query:', JSON.stringify(query, null, 2))

    try {
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 }) // Sort by newest first
        .exec()

      console.log('✅ getNotificationsByClinicId - Successfully fetched notifications:', notifications.length)
      return notifications
    } catch (error) {
      console.error('❌ getNotificationsByClinicId - Error fetching notifications:', error)
      throw error
    }
  }

  async getUnreadCountByClinicId(clinicId: string) {
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      throw new Error('Invalid Clinic ID')
    }

    return Notification.countDocuments({
      clinicId: new mongoose.Types.ObjectId(clinicId),
      isRead: false,
    }).exec()
  }

  // Utility methods for common notification scenarios
  async createAppointmentNotification(userId: string, appointmentData: {
    appointmentId: string
    patientName: string
    doctorName: string
    scheduledDate: Date
    consultationMode: string
  }) {
    return this.createNotification({
      userId,
      title: 'New Appointment Scheduled',
      message: `Appointment with ${appointmentData.patientName} scheduled for ${appointmentData.scheduledDate.toLocaleDateString()} at ${appointmentData.scheduledDate.toLocaleTimeString()}`,
      type: 'appointment',
      relatedId: appointmentData.appointmentId,
      metadata: {
        appointmentId: appointmentData.appointmentId,
        patientName: appointmentData.patientName,
        doctorName: appointmentData.doctorName,
        scheduledDate: appointmentData.scheduledDate,
        consultationMode: appointmentData.consultationMode,
      },
    })
  }

  async createBillingNotification(userId: string, billingData: {
    invoiceId: string
    amount: number
    patientName: string
    invoiceType: 'payment_received' | 'payment_due' | 'invoice_created'
  }) {
    const messages = {
      payment_received: `Payment of $${billingData.amount} received for ${billingData.patientName}`,
      payment_due: `Payment of $${billingData.amount} is due for ${billingData.patientName}`,
      invoice_created: `Invoice of $${billingData.amount} created for ${billingData.patientName}`,
    }

    return this.createNotification({
      userId,
      title: 'Billing Update',
      message: messages[billingData.invoiceType],
      type: 'billing',
      relatedId: billingData.invoiceId,
      metadata: {
        invoiceId: billingData.invoiceId,
        amount: billingData.amount,
        patientName: billingData.patientName,
        invoiceType: billingData.invoiceType,
      },
    })
  }

  async createConsentNotification(userId: string, consentData: {
    consentId: string
    patientName: string
    consentType: string
    status: 'pending' | 'signed' | 'expired'
  }) {
    const messages = {
      pending: `Consent form pending for ${consentData.patientName}`,
      signed: `Consent form signed by ${consentData.patientName}`,
      expired: `Consent form expired for ${consentData.patientName}`,
    }

    return this.createNotification({
      userId,
      title: 'Consent Form Update',
      message: messages[consentData.status],
      type: 'consent',
      relatedId: consentData.consentId,
      metadata: {
        consentId: consentData.consentId,
        patientName: consentData.patientName,
        consentType: consentData.consentType,
        status: consentData.status,
      },
    })
  }

  async createSystemNotification(userId: string, systemData: {
    title: string
    message: string
    priority: 'low' | 'medium' | 'high'
    category: string
  }) {
    return this.createNotification({
      userId,
      title: systemData.title,
      message: systemData.message,
      type: 'system',
      metadata: {
        priority: systemData.priority,
        category: systemData.category,
      },
    })
  }

  async createReminderNotification(userId: string, reminderData: {
    title: string
    message: string
    reminderType: 'appointment' | 'medication' | 'followup' | 'custom'
    dueDate: Date
  }) {
    return this.createNotification({
      userId,
      title: reminderData.title,
      message: reminderData.message,
      type: 'reminder',
      metadata: {
        reminderType: reminderData.reminderType,
        dueDate: reminderData.dueDate,
      },
    })
  }
}
