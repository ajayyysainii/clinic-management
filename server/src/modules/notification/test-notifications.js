const mongoose = require('mongoose');
const { Notification } = require('./models');
const User = require('../../user/models/user.model').default;

// Test function to create sample notifications
async function createTestNotifications() {
  try {
    console.log('🔍 Creating test notifications...');

    // Find a user with admin role and clinic
    const adminUser = await User.findOne({
      roles: { $in: ['admin'] },
      clinic: { $exists: true, $ne: null }
    });

    if (!adminUser) {
      console.log('❌ No admin user with clinic found');
      return;
    }

    console.log('✅ Found admin user:', adminUser.name, 'Clinic:', adminUser.clinic);

    // Create sample notifications
    const testNotifications = [
      {
        userId: adminUser._id,
        clinicId: adminUser.clinic,
        title: 'New Appointment Scheduled',
        message: 'Appointment with John Doe scheduled for tomorrow at 2:00 PM',
        type: 'appointment',
        metadata: {
          appointmentId: 'test-appointment-1',
          patientName: 'John Doe',
          consultationMode: 'Video Call',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        }
      },
      {
        userId: adminUser._id,
        clinicId: adminUser.clinic,
        title: 'Payment Received',
        message: 'Payment of $150 received for appointment with Jane Smith',
        type: 'billing',
        metadata: {
          invoiceId: 'test-invoice-1',
          amount: 150,
          patientName: 'Jane Smith',
          invoiceType: 'payment_received'
        }
      },
      {
        userId: adminUser._id,
        clinicId: adminUser.clinic,
        title: 'Consent Form Pending',
        message: 'Consent form pending for patient Mike Johnson',
        type: 'consent',
        metadata: {
          consentId: 'test-consent-1',
          patientName: 'Mike Johnson',
          consentType: 'treatment',
          status: 'pending'
        }
      },
      {
        userId: adminUser._id,
        clinicId: adminUser.clinic,
        title: 'System Maintenance',
        message: 'System will be down for maintenance on Sunday from 2-4 AM',
        type: 'system',
        metadata: {
          priority: 'medium',
          category: 'maintenance'
        }
      },
      {
        userId: adminUser._id,
        clinicId: adminUser.clinic,
        title: 'Follow-up Reminder',
        message: 'Follow-up appointment reminder for Sarah Wilson',
        type: 'reminder',
        metadata: {
          reminderType: 'followup',
          patientName: 'Sarah Wilson',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next week
        }
      }
    ];

    // Create notifications
    for (const notificationData of testNotifications) {
      const notification = new Notification(notificationData);
      await notification.save();
      console.log('✅ Created notification:', notification.title);
    }

    console.log('✅ Test notifications created successfully!');

    // Display created notifications
    const notifications = await Notification.find({ clinicId: adminUser.clinic }).sort({ createdAt: -1 });
    console.log(`📊 Total notifications for clinic: ${notifications.length}`);

    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} - ${notif.type} - ${notif.isRead ? 'Read' : 'Unread'}`);
    });

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  }
}

// Export for use in other files
module.exports = { createTestNotifications };

// Run if this file is executed directly
if (require.main === module) {
  // Connect to MongoDB (you'll need to set up your connection)
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database')
    .then(() => {
      console.log('Connected to MongoDB');
      return createTestNotifications();
    })
    .then(() => {
      console.log('Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
