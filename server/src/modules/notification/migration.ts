import mongoose from 'mongoose'
import { Notification } from './models'

export async function migrateNotifications() {
  try {
    console.log('Starting notification migration...')

    // Find all notifications with the old schema
    const oldNotifications = await Notification.find({
      DoctorUserId: { $exists: true }
    })

    console.log(`Found ${oldNotifications.length} notifications to migrate`)

    for (const notification of oldNotifications) {
      // Cast to any to access old schema properties
      const oldNotification = notification as any

      // Create new notification with updated schema
      const newNotification = {
        userId: oldNotification.DoctorUserId,
        title: oldNotification.title,
        message: oldNotification.message,
        type: 'appointment', // Default to appointment type for old notifications
        metadata: {
          appointmentScheduled: oldNotification.appointmentScheduled,
          consultationMode: oldNotification.consultationMode,
          migrated: true,
          originalId: oldNotification._id
        },
        isRead: oldNotification.isRead,
        createdAt: oldNotification.createdAt,
        updatedAt: oldNotification.updatedAt
      }

      // Insert new notification
      await Notification.create(newNotification)

      // Delete old notification
      await Notification.findByIdAndDelete(oldNotification._id)

      console.log(`Migrated notification: ${oldNotification._id}`)
    }

    console.log('Notification migration completed successfully')
  } catch (error) {
    console.error('Error during notification migration:', error)
    throw error
  }
}

// Function to run migration
export async function runMigration() {
  try {
    await migrateNotifications()
    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Export for manual execution
if (require.main === module) {
  runMigration()
}
