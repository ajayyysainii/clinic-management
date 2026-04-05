import { Router } from 'express'
import { ServicesController } from '../controllers'
import { authenticate, authorize } from '../../../middlewares/'

const router = Router()
const servicesController = new ServicesController()

// Create new service
router.post(
  '/',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head', 'staff','superadmin','hybrid']),
  servicesController.createService,
)

// Get all services for clinic
router.get(
  '/',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin','hybrid']),
  servicesController.getServicesByClinic,
)

// Get services statistics - MUST come before /:id route
router.get(
  '/stats',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin','hybrid']),
  servicesController.getServicesStats,
)

// Search services for autocomplete - MUST come before /:id route
router.get(
  '/search',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin','hybrid']),
  servicesController.searchServices,
)

// Get service by ID
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin','hybrid']),
  servicesController.getServiceById,
)

// Update service
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head', 'staff','superadmin','hybrid']),
  servicesController.updateService,
)

// Delete service
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head','superadmin','hybrid']),
  servicesController.deleteService,
)

export default router
