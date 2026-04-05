import { Router } from 'express'
import { authenticate, authorize } from '../../../middlewares/'
import { NotificationController } from '../controllers'

const router = Router()
const notificationController = new NotificationController()

// Get notifications for a specific user (admin only)
router.get(
  '/users/:userId',
  authenticate,
  authorize(['admin', 'superadmin', 'clinic-admin', 'clinic-head','staff','superadmin']),
  notificationController.getNotificationsByUserId,
)

// Get current user's notifications (all authenticated users)
router.get(
  '/my-notifications',
  authenticate,
  notificationController.getMyNotifications,
)

// Get notifications for current user's clinic (clinic users only)
router.get(
  '/clinic-notifications',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head']),
  notificationController.getNotificationsByClinic,
)

// Mark notifications as read for a specific user (admin only)
router.put(
  '/users/:userId/mark-read',
  authenticate,
  authorize(['admin', 'superadmin', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  notificationController.markNotificationsAsRead,
)

// Mark current user's notifications as read (all authenticated users)
router.put(
  '/mark-read',
  authenticate,
  notificationController.markNotificationsAsRead,
)

// Mark current user's clinic notifications as read (clinic users only)
router.put(
  '/clinic-mark-read',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head']),
  notificationController.markClinicNotificationsAsRead,
)

// Create a single notification (authenticated users)
router.post(
  '/create',
  authenticate,
  notificationController.createNotification,
)

// Create bulk notifications (authenticated users)
router.post(
  '/create-bulk',
  authenticate,
  notificationController.createBulkNotifications,
)

// Delete a notification (users can only delete their own notifications)
router.delete(
  '/:notificationId',
  authenticate,
  notificationController.deleteNotification,
)

// Get unread count for current user (all authenticated users)
router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount,
)

// Get unread count for current user's clinic (clinic users only)
router.get(
  '/clinic-unread-count',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head']),
  notificationController.getUnreadCountByClinic,
)

export default router
