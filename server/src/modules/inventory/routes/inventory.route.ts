import { Router } from 'express'
import { InventoryController } from '../controllers'
import { authenticate, authorize } from '../../../middlewares/'

const router = Router()
const inventoryController = new InventoryController()

// Create new inventory item
router.post(
  '/',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head', 'staff','superadmin','hybrid']),
  inventoryController.createInventoryItem,
)

// Get all inventory items for clinic
router.get(
  '/',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin']),
  inventoryController.getInventoryByClinic,
)

// Get low stock items - MUST come before /:id route
router.get(
  '/low-stock',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin']),
  inventoryController.getLowStockItems,
)

// Get expiring items - MUST come before /:id route
router.get(
  '/expiring',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin']),
  inventoryController.getExpiringItems,
)

// Get inventory statistics - MUST come before /:id route
router.get(
  '/stats',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin']),
  inventoryController.getInventoryStats,
)

// Search inventory items for autocomplete - MUST come before /:id route
router.get(
  '/search',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin']),
  inventoryController.searchInventoryItems,
)

// Debug route for total value calculation - MUST come before /:id route
router.get(
  '/debug-total-value',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin']),
  inventoryController.debugTotalValue,
)

// Debug route to check all inventory items - MUST come before /:id route
router.get(
  '/debug-all-items',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin']),
  inventoryController.debugAllItems,
)

// Get inventory item by ID
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'doctor', 'clinic-admin', 'clinic-head', 'hybrid', 'staff','superadmin']),
  inventoryController.getInventoryItemById,
)

// Update inventory item
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head', 'staff','superadmin','hybrid']),
  inventoryController.updateInventoryItem,
)

// Delete inventory item
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head','superadmin','hybrid']),
  inventoryController.deleteInventoryItem,
)

// Update stock quantity
router.patch(
  '/:id/stock',
  authenticate,
  authorize(['admin', 'clinic-admin', 'clinic-head', 'staff','superadmin','hybrid']),
  inventoryController.updateStockQuantity,
)

export default router
