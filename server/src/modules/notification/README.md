# Generic Notification System

This module provides a generic notification system that supports all user roles (admin, doctor, patient, staff, etc.) instead of being limited to doctors only.

## Features

- **Generic User Support**: Works with any user role (admin, doctor, patient, staff, etc.)
- **Flexible Notification Types**: Support for appointment, billing, consent, system, and reminder notifications
- **Rich Metadata**: Store additional data in a flexible metadata field
- **Bulk Operations**: Create multiple notifications at once
- **Utility Methods**: Pre-built methods for common notification scenarios

## API Endpoints

### Get Notifications

#### Get current user's notifications
```
GET /notifications/my-notifications
```
**Access**: All authenticated users

#### Get notifications for a specific user (admin only)
```
GET /notifications/users/:userId
```
**Access**: Admin, superadmin, clinic-admin, clinic-head

### Mark Notifications as Read

#### Mark current user's notifications as read
```
PUT /notifications/mark-read
Body: { notificationIds?: string[] }
```
**Access**: All authenticated users

#### Mark notifications as read for a specific user (admin only)
```
PUT /notifications/users/:userId/mark-read
Body: { notificationIds?: string[] }
```
**Access**: Admin, superadmin, clinic-admin, clinic-head

### Create Notifications

#### Create a single notification (admin only)
```
POST /notifications/create
Body: {
  userId: string
  title: string
  message: string
  type?: string
  relatedId?: string
  metadata?: Record<string, any>
}
```
**Access**: Admin, superadmin, clinic-admin, clinic-head

#### Create bulk notifications (admin only)
```
POST /notifications/create-bulk
Body: {
  notifications: Array<{
    userId: string
    title: string
    message: string
    type?: string
    relatedId?: string
    metadata?: Record<string, any>
  }>
}
```
**Access**: Admin, superadmin, clinic-admin, clinic-head

### Delete Notifications

#### Delete a notification (users can only delete their own)
```
DELETE /notifications/:notificationId
```
**Access**: All authenticated users

### Get Unread Count

#### Get unread count for current user
```
GET /notifications/unread-count
```
**Access**: All authenticated users

## Notification Types

- `appointment`: Appointment-related notifications
- `billing`: Billing and payment notifications
- `consent`: Consent form notifications
- `system`: System-wide notifications
- `reminder`: Reminder notifications
- `custom`: Custom notifications

## Utility Methods

The service provides utility methods for common notification scenarios:

### Appointment Notifications
```typescript
await notificationService.createAppointmentNotification(userId, {
  appointmentId: string
  patientName: string
  doctorName: string
  scheduledDate: Date
  consultationMode: string
})
```

### Billing Notifications
```typescript
await notificationService.createBillingNotification(userId, {
  invoiceId: string
  amount: number
  patientName: string
  invoiceType: 'payment_received' | 'payment_due' | 'invoice_created'
})
```

### Consent Notifications
```typescript
await notificationService.createConsentNotification(userId, {
  consentId: string
  patientName: string
  consentType: string
  status: 'pending' | 'signed' | 'expired'
})
```

### System Notifications
```typescript
await notificationService.createSystemNotification(userId, {
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  category: string
})
```

### Reminder Notifications
```typescript
await notificationService.createReminderNotification(userId, {
  title: string
  message: string
  reminderType: 'appointment' | 'medication' | 'followup' | 'custom'
  dueDate: Date
})
```

## Database Schema

```typescript
interface INotification {
  userId: mongoose.Types.ObjectId
  title: string
  message: string
  type: string
  relatedId?: mongoose.Types.ObjectId
  metadata?: Record<string, any>
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}
```

## Migration

To migrate existing notifications from the old doctor-specific schema:

```bash
# Run the migration script
npm run migrate:notifications
```

## Usage Examples

### Creating a notification for a patient
```typescript
await notificationService.createNotification({
  userId: patientId,
  title: 'Appointment Reminder',
  message: 'Your appointment is scheduled for tomorrow at 2 PM',
  type: 'appointment',
  metadata: {
    appointmentId: 'appointment123',
    reminderType: 'appointment'
  }
})
```

### Creating a notification for a doctor
```typescript
await notificationService.createAppointmentNotification(doctorId, {
  appointmentId: 'appointment123',
  patientName: 'John Doe',
  doctorName: 'Dr. Smith',
  scheduledDate: new Date('2024-01-15T14:00:00Z'),
  consultationMode: 'Video Call'
})
```

### Creating a system notification for all admins
```typescript
const adminUsers = await User.find({ roles: { $in: ['admin', 'superadmin'] } })
const notifications = adminUsers.map(user => ({
  userId: user._id,
  title: 'System Maintenance',
  message: 'System will be down for maintenance on Sunday',
  type: 'system',
  metadata: {
    priority: 'high',
    category: 'maintenance'
  }
}))

await notificationService.createBulkNotifications(notifications)
``` 
