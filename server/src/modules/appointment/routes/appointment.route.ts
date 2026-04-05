import { Router } from 'express'
import { authenticate, authorize } from '../../../middlewares'
import { AppointmentController } from '../controllers'


const appointmentController = new AppointmentController()


const router = Router()

router.get(
  '/clinic',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  appointmentController.getAppointmentsByClinicId,
)

router.get(
  '/clinic/completed',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  appointmentController.getCompletedAppointmentsByClinicId,
)

router.get(
  '/:userId',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  appointmentController.getAppointmentsByDoctorId,
)

router.put(
  '/update/:appointmentId',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  appointmentController.updateAppointment,
)

router.put(
  '/:appointmentId',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  appointmentController.getAppointmentsCancelled,
)

// Add route for fetching visits by ClinicPatient ID
router.get(
  '/visits/:clinicPatientId',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin','patient']),
  appointmentController.getVisitsByUserId,
)

router.post('/create', appointmentController.createAppointment)

// Add route for sending appointment reminders
router.post(
  '/reminder/:appointmentId',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head','hybrid','staff','superadmin']),
  appointmentController.sendAppointmentReminder,
)

// Add route for Google Form appointment creation
router.post(
  '/google-form',
  appointmentController.createAppointmentUsingGoogleForm,
)

export default router
