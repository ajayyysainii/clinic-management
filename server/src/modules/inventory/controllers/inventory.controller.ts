import { Request, Response } from 'express'
import { InventoryService } from '../services'
import mongoose from 'mongoose'
import { InventoryCategory, UnitType } from '../models'
import { AuthenticatedRequest } from '../../../types'

export class InventoryController {
  private InventoryService: InventoryService

  constructor() {
    this.InventoryService = new InventoryService()
  }

  createInventoryItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        itemName,
        description,
        category,
        quantity,
        unit,
        minQuantity,
        supplier,
        supplierContact,
        costPrice,
        sellingPrice,
        expiryDate,
        location,
        barcode,
        sku,
        isActive,
      } = req.body

      const clinicId = req.currentUser?.clinic
      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const inventoryData = {
        itemName,
        description,
        category: category || InventoryCategory.OTHER,
        quantity: Number(quantity) || 0,
        unit: unit || UnitType.PIECES,
        minQuantity: Number(minQuantity) || 0,
        supplier,
        supplierContact,
        costPrice: Number(costPrice) || 0,
        sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        location,
        barcode,
        sku,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      }

      const result = await this.InventoryService.createInventoryItem({
        ...inventoryData,
        clinicId,
      })

      res.status(201).json({
        success: true,
        message: 'Inventory item created successfully',
        data: result,
      })
    } catch (error: any) {
      console.error('Inventory item creation error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create inventory item',
      })
    }
  }

  getInventoryByClinic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const inventory = await this.InventoryService.getInventoryByClinic(clinicId)

      res.status(200).json({
        success: true,
        message: 'Inventory list fetched successfully',
        data: inventory,
        count: inventory.length,
      })
    } catch (error: any) {
      console.error('Get inventory error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch inventory list',
      })
    }
  }

  getInventoryItemById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Valid inventory item ID is required',
        })
        return
      }

      const item = await this.InventoryService.getInventoryItemById(id, clinicId)

      if (!item) {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Inventory item fetched successfully',
        data: item,
      })
    } catch (error: any) {
      console.error('Get inventory item error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch inventory item',
      })
    }
  }

  updateInventoryItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const {
        itemName,
        description,
        category,
        quantity,
        unit,
        minQuantity,
        supplier,
        supplierContact,
        costPrice,
        sellingPrice,
        expiryDate,
        location,
        barcode,
        sku,
        isActive,
      } = req.body

      const clinicId = req.currentUser?.clinic
      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Valid inventory item ID is required',
        })
        return
      }

      const updateData: any = {}
      if (itemName !== undefined) updateData.itemName = itemName
      if (description !== undefined) updateData.description = description
      if (category !== undefined) updateData.category = category
      if (quantity !== undefined) updateData.quantity = Number(quantity)
      if (unit !== undefined) updateData.unit = unit
      if (minQuantity !== undefined) updateData.minQuantity = Number(minQuantity)
      if (supplier !== undefined) updateData.supplier = supplier
      if (supplierContact !== undefined) updateData.supplierContact = supplierContact
      if (costPrice !== undefined) updateData.costPrice = Number(costPrice)
      if (sellingPrice !== undefined) updateData.sellingPrice = sellingPrice ? Number(sellingPrice) : undefined
      if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : undefined
      if (location !== undefined) updateData.location = location
      if (barcode !== undefined) updateData.barcode = barcode
      if (sku !== undefined) updateData.sku = sku
      if (isActive !== undefined) updateData.isActive = Boolean(isActive)

      const result = await this.InventoryService.updateInventoryItem(id, clinicId, updateData)

      if (!result) {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Inventory item updated successfully',
        data: result,
      })
    } catch (error: any) {
      console.error('Update inventory item error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update inventory item',
      })
    }
  }

  deleteInventoryItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Valid inventory item ID is required',
        })
        return
      }

      const deletedItem = await this.InventoryService.deleteInventoryItem(id, clinicId)

      if (!deletedItem) {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Inventory item deleted successfully',
        data: deletedItem,
      })
    } catch (error: any) {
      console.error('Delete inventory item error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete inventory item',
      })
    }
  }

  getLowStockItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const lowStockItems = await this.InventoryService.getLowStockItems(clinicId)

      res.status(200).json({
        success: true,
        message: 'Low stock items fetched successfully',
        data: lowStockItems,
        count: lowStockItems.length,
      })
    } catch (error: any) {
      console.error('Get low stock items error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch low stock items',
      })
    }
  }

  getExpiringItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic
      const { days = 30 } = req.query

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const expiringItems = await this.InventoryService.getExpiringItems(clinicId, Number(days))

      res.status(200).json({
        success: true,
        message: 'Expiring items fetched successfully',
        data: expiringItems,
        count: expiringItems.length,
      })
    } catch (error: any) {
      console.error('Get expiring items error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch expiring items',
      })
    }
  }

  updateStockQuantity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { quantity, operation = 'add' } = req.body
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'Valid inventory item ID is required',
        })
        return
      }

      if (!quantity || isNaN(Number(quantity))) {
        res.status(400).json({
          success: false,
          error: 'Valid quantity is required',
        })
        return
      }

      const result = await this.InventoryService.updateStockQuantity(
        id,
        clinicId,
        Number(quantity),
        operation as 'add' | 'subtract'
      )

      if (!result) {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Stock quantity updated successfully',
        data: result,
      })
    } catch (error: any) {
      console.error('Update stock quantity error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update stock quantity',
      })
    }
  }

  getInventoryStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const stats = await this.InventoryService.getInventoryStats(clinicId)

      // Debug logging
      console.log('Stats being sent to frontend:', stats);

      res.status(200).json({
        success: true,
        message: 'Inventory statistics fetched successfully',
        data: stats,
      })
    } catch (error: any) {
      console.error('Get inventory stats error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch inventory statistics',
      })
    }
  }

  // Debug method to test total value calculation
  debugTotalValue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const result = await this.InventoryService.debugTotalValue(clinicId)

      res.status(200).json({
        success: true,
        message: 'Total inventory value calculated successfully',
        data: result,
      })
    } catch (error: any) {
      console.error('Debug total value error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate total inventory value',
      })
    }
  }

  searchInventoryItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic
      const { query, category, limit = 10 } = req.query

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const searchQuery = query as string
      if (!searchQuery || searchQuery.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters long',
        })
        return
      }

      console.log('Search request:', { clinicId, query: searchQuery, category, limit });

      const result = await this.InventoryService.searchInventoryItems(
        clinicId,
        searchQuery.trim(),
        category as string,
        Number(limit)
      )

      console.log('Search response:', { resultCount: result.length, result });

      res.status(200).json({
        success: true,
        message: 'Inventory items found successfully',
        data: result,
        count: result.length,
      })
    } catch (error: any) {
      console.error('Search inventory items error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search inventory items',
      })
    }
  }

  debugAllItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const result = await this.InventoryService.debugAllItems(clinicId)

      res.status(200).json({
        success: true,
        message: 'All inventory items fetched successfully',
        data: result,
        count: result.length,
      })
    } catch (error: any) {
      console.error('Debug all items error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch all inventory items',
      })
    }
  }
}
