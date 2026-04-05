import { Request, Response } from 'express'
import { NotificationService } from '../services/notification.service'
import mongoose from 'mongoose'
import { AuthenticatedRequest } from '../../../types'

export class NotificationController {
  private notificationService: NotificationService

  constructor() {
    this.notificationService = new NotificationService()
  }

  getNotificationsByUserId = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        })
        return
      }

      // Optional query parameter to filter by read status
      const { read } = req.query
      const readStatus = read === 'true'

      const notifications = await this.notificationService.getNotificationsByUserId(
        userId.toString(),
        readStatus,
      )

      res.status(200).json({
        success: true,
        data: notifications,
        count: notifications.length,
      })
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch notifications',
      })
    }
  }

  getMyNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.currentUser?._id

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User not authenticated',
        })
        return
      }

      // Optional query parameter to filter by read status
      const { read } = req.query
      const readStatus = read === 'true'

      const notifications = await this.notificationService.getNotificationsByUserId(
        userId.toString(),
        readStatus,
      )

      res.status(200).json({
        success: true,
        data: notifications,
        count: notifications.length,
      })
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch notifications',
      })
    }
  }

  getNotificationsByClinic = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const clinicId = req.currentUser?.clinic
      const userRoles = req.currentUser?.roles || []

      console.log('🔍 getNotificationsByClinic - Debug info:')
      console.log('Current user:', req.currentUser?._id)
      console.log('User roles:', userRoles)
      console.log('Clinic ID from user:', clinicId)
      console.log('Clinic ID type:', typeof clinicId)
      console.log('Is clinicId valid ObjectId:', clinicId ? mongoose.Types.ObjectId.isValid(clinicId) : 'N/A')

      // Check if user has appropriate roles
      const hasClinicRole = userRoles.some(role =>
        ['admin', 'clinic-admin', 'clinic-head'].includes(role)
      )

      if (!hasClinicRole) {
        console.log('❌ getNotificationsByClinic - User does not have clinic role')
        res.status(403).json({
          success: false,
          error: 'User does not have permission to access clinic notifications',
        })
        return
      }

      if (!clinicId) {
        console.log('❌ getNotificationsByClinic - No clinic ID found in user context')
        res.status(400).json({
          success: false,
          error: 'Clinic ID is missing from user context. User may not be associated with a clinic.',
        })
        return
      }

      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        console.log('❌ getNotificationsByClinic - Invalid clinic ID format:', clinicId)
        res.status(400).json({
          success: false,
          error: 'Invalid clinic ID format',
        })
        return
      }

      // Optional query parameter to filter by read status
      const { read } = req.query
      const readStatus = read === 'true'

      console.log('🔍 getNotificationsByClinic - Calling service with clinicId:', clinicId.toString())

      const notifications = await this.notificationService.getNotificationsByClinicId(
        clinicId as any,
        readStatus,
      )

      console.log('✅ getNotificationsByClinic - Successfully fetched notifications:', notifications.length)

      res.status(200).json({
        success: true,
        data: notifications,
        count: notifications.length,
      })
    } catch (error: any) {
      console.error('❌ Error fetching clinic notifications:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch clinic notifications',
      })
    }
  }

  markNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.userId || req.currentUser?._id
      const { notificationIds } = req.body

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        })
        return
      }

      // Validate notification IDs if provided
      if (notificationIds && Array.isArray(notificationIds)) {
        for (const id of notificationIds) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
              success: false,
              error: `Invalid notification ID: ${id}`,
            })
            return
          }
        }
      }

      const result = await this.notificationService.markNotificationsAsRead(userId.toString(), notificationIds)

      res.status(200).json({
        success: true,
        message: 'Notifications marked as read',
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        },
      })
    } catch (error: any) {
      console.error('Error marking notifications as read:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to mark notifications as read',
      })
    }
  }

  markClinicNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const clinicId = req.currentUser?.clinic
      const { notificationIds } = req.body
      const userRoles = req.currentUser?.roles || []

      console.log('🔍 markClinicNotificationsAsRead - Debug info:')
      console.log('Current user:', req.currentUser?._id)
      console.log('User roles:', userRoles)
      console.log('Clinic ID from user:', clinicId)
      console.log('Notification IDs to mark:', notificationIds)

      // Check if user has appropriate roles
      const hasClinicRole = userRoles.some(role =>
        ['admin', 'clinic-admin', 'clinic-head'].includes(role)
      )

      if (!hasClinicRole) {
        console.log('❌ markClinicNotificationsAsRead - User does not have clinic role')
        res.status(403).json({
          success: false,
          error: 'User does not have permission to mark clinic notifications as read',
        })
        return
      }

      if (!clinicId) {
        console.log('❌ markClinicNotificationsAsRead - No clinic ID found in user context')
        res.status(400).json({
          success: false,
          error: 'Clinic ID is missing from user context',
        })
        return
      }

      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        console.log('❌ markClinicNotificationsAsRead - Invalid clinic ID format:', clinicId)
        res.status(400).json({
          success: false,
          error: 'Invalid clinic ID format',
        })
        return
      }

      // Validate notification IDs if provided
      if (notificationIds && Array.isArray(notificationIds)) {
        for (const id of notificationIds) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
              success: false,
              error: `Invalid notification ID: ${id}`,
            })
            return
          }
        }
      }

      const result = await this.notificationService.markClinicNotificationsAsRead(
        clinicId as any,
        notificationIds
      )

      console.log('✅ markClinicNotificationsAsRead - Successfully marked notifications as read')

      res.status(200).json({
        success: true,
        message: 'Clinic notifications marked as read',
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        },
      })
    } catch (error: any) {
      console.error('❌ Error marking clinic notifications as read:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to mark clinic notifications as read',
      })
    }
  }

  createNotification = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, title, message, type, relatedId, metadata } = req.body
      const clinicId = req.currentUser?.clinic

      if (!userId || !title || !message) {
        res.status(400).json({
          success: false,
          error: 'User ID, title, and message are required',
        })
        return
      }

      const notification = await this.notificationService.createNotification({
        userId,
        clinicId: clinicId?.toString(),
        title,
        message,
        type,
        relatedId,
        metadata,
      })

      res.status(201).json({
        success: true,
        data: notification,
        message: 'Notification created successfully',
      })
    } catch (error: any) {
      console.error('Error creating notification:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create notification',
      })
    }
  }

  createBulkNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { notifications } = req.body
      const clinicId = req.currentUser?.clinic

      if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Notifications array is required',
        })
        return
      }

      // Add clinicId to all notifications if not already present
      const notificationsWithClinic = notifications.map(notification => ({
        ...notification,
        clinicId: notification.clinicId || clinicId?.toString()
      }))

      const createdNotifications = await this.notificationService.createBulkNotifications(notificationsWithClinic)

      res.status(201).json({
        success: true,
        data: createdNotifications,
        message: `${createdNotifications.length} notifications created successfully`,
      })
    } catch (error: any) {
      console.error('Error creating bulk notifications:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create notifications',
      })
    }
  }

  deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notificationId = req.params.notificationId
      const userId = req.currentUser?._id

      if (!notificationId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Notification ID and user authentication are required',
        })
        return
      }

      const result = await this.notificationService.deleteNotification(notificationId, userId.toString())

      if (!result) {
        res.status(404).json({
          success: false,
          error: 'Notification not found or access denied',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting notification:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete notification',
      })
    }
  }

  getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.currentUser?._id

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User not authenticated',
        })
        return
      }

      const count = await this.notificationService.getUnreadCount(userId.toString())

      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      })
    } catch (error: any) {
      console.error('Error fetching unread count:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch unread count',
      })
    }
  }

  getUnreadCountByClinic = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const clinicId = req.currentUser?.clinic

      console.log('🔍 getUnreadCountByClinic - Debug info:')
      console.log('Current user:', req.currentUser?._id)
      console.log('Clinic ID from user:', clinicId)
      console.log('Clinic ID type:', typeof clinicId)
      console.log('Is clinicId valid ObjectId:', clinicId ? mongoose.Types.ObjectId.isValid(clinicId) : 'N/A')

      if (!clinicId) {
        console.log('❌ getUnreadCountByClinic - No clinic ID found in user context')
        res.status(400).json({
          success: false,
          error: 'Clinic ID is missing from user context. User may not be associated with a clinic.',
        })
        return
      }

      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        console.log('❌ getUnreadCountByClinic - Invalid clinic ID format:', clinicId)
        res.status(400).json({
          success: false,
          error: 'Invalid clinic ID format',
        })
        return
      }

      console.log('🔍 getUnreadCountByClinic - Calling service with clinicId:', clinicId.toString())

      const count = await this.notificationService.getUnreadCountByClinicId(clinicId.toString())

      console.log('✅ getUnreadCountByClinic - Successfully fetched unread count:', count)

      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      })
    } catch (error: any) {
      console.error('❌ Error fetching clinic unread count:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch clinic unread count',
      })
    }
  }
}
