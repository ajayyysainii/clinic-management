import mongoose from 'mongoose'
import { Inventory, IInventory, InventoryCategory, UnitType } from '../models'

interface InventoryData {
  itemName: string
  description?: string
  category: InventoryCategory
  quantity: number
  unit: UnitType
  minQuantity: number
  supplier?: string
  supplierContact?: string
  costPrice: number
  sellingPrice?: number
  expiryDate?: Date
  location?: string
  barcode?: string
  sku?: string
  isActive?: boolean
}

export class InventoryService {
  async createInventoryItem(data: InventoryData & { clinicId: mongoose.Types.ObjectId }): Promise<IInventory> {
    try {
      const inventoryItem = new Inventory({
        ...data,
        isActive: data.isActive ?? true,
      })

      const savedItem = await inventoryItem.save()
      return savedItem
    } catch (error) {
      throw error
    }
  }

  async getInventoryByClinic(clinicId: mongoose.Types.ObjectId): Promise<IInventory[]> {
    try {
      const inventory = await Inventory.find({
        clinicId: clinicId,
        deletedAt: null,
      }).sort({ createdAt: -1 })

      return inventory
    } catch (error) {
      throw error
    }
  }

  async getInventoryItemById(id: string, clinicId: mongoose.Types.ObjectId): Promise<IInventory | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid inventory item ID format')
      }

      const item = await Inventory.findOne({
        _id: id,
        clinicId: clinicId,
        deletedAt: null,
      })

      return item
    } catch (error) {
      throw error
    }
  }

  async updateInventoryItem(
    id: string,
    clinicId: mongoose.Types.ObjectId,
    updateData: Partial<InventoryData>,
  ): Promise<IInventory | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid inventory item ID format')
      }

      const updatedItem = await Inventory.findOneAndUpdate(
        {
          _id: id,
          clinicId: clinicId,
          deletedAt: null,
        },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        },
      )

      return updatedItem
    } catch (error) {
      throw error
    }
  }

  async deleteInventoryItem(id: string, clinicId: mongoose.Types.ObjectId): Promise<IInventory | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid inventory item ID format')
      }

      const deletedItem = await Inventory.findOneAndUpdate(
        {
          _id: id,
          clinicId: clinicId,
          deletedAt: null,
        },
        {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          new: true,
        },
      )

      return deletedItem
    } catch (error) {
      throw error
    }
  }

  async getLowStockItems(clinicId: mongoose.Types.ObjectId): Promise<IInventory[]> {
    try {
      // Validate clinicId
      if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID provided');
      }

      const lowStockItems = await Inventory.find({
        clinicId: clinicId,
        deletedAt: null,
        $expr: {
          $lte: ['$quantity', '$minQuantity'],
        },
      }).sort({ quantity: 1 })

      return lowStockItems
    } catch (error) {
      console.error('Error in getLowStockItems:', error);
      return [];
    }
  }

  async getExpiringItems(clinicId: mongoose.Types.ObjectId, daysThreshold: number = 30): Promise<IInventory[]> {
    try {
      // Validate clinicId
      if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID provided');
      }

      const thresholdDate = new Date()
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

      const expiringItems = await Inventory.find({
        clinicId: clinicId,
        deletedAt: null,
        expiryDate: {
          $exists: true,
          $ne: null,
          $lte: thresholdDate,
        },
      }).sort({ expiryDate: 1 })

      return expiringItems
    } catch (error) {
      console.error('Error in getExpiringItems:', error);
      return [];
    }
  }

  async updateStockQuantity(
    id: string,
    clinicId: mongoose.Types.ObjectId,
    quantityChange: number,
    operation: 'add' | 'subtract' = 'add',
  ): Promise<IInventory | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid inventory item ID format')
      }

      const item = await Inventory.findOne({
        _id: id,
        clinicId: clinicId,
        deletedAt: null,
      })

      if (!item) {
        throw new Error('Inventory item not found')
      }

      const newQuantity = operation === 'add'
        ? item.quantity + quantityChange
        : item.quantity - quantityChange

      if (newQuantity < 0) {
        throw new Error('Quantity cannot be negative')
      }

      const updatedItem = await Inventory.findOneAndUpdate(
        {
          _id: id,
          clinicId: clinicId,
          deletedAt: null,
        },
        {
          quantity: newQuantity,
          updatedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        },
      )

      return updatedItem
    } catch (error) {
      throw error
    }
  }

  async getInventoryStats(clinicId: mongoose.Types.ObjectId): Promise<{
    totalItems: number
    lowStockItems: number
    expiringItems: number
    totalValue: number
  }> {
    try {
      // Validate clinicId
      if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID provided');
      }

      const [totalItems, lowStockItems, expiringItems] = await Promise.all([
        Inventory.countDocuments({
          clinicId: clinicId,
          deletedAt: null,
        }),
        Inventory.countDocuments({
          clinicId: clinicId,
          deletedAt: null,
          $expr: {
            $lte: ['$quantity', '$minQuantity'],
          },
        }),
        Inventory.countDocuments({
          clinicId: clinicId,
          deletedAt: null,
          expiryDate: {
            $exists: true,
            $ne: null,
            $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        }),
      ])

      // Simplified total value calculation - fetch all items and calculate manually
      let totalValue = 0;
      try {
        const allItems = await Inventory.find({
          clinicId: clinicId,
          deletedAt: null,
        }).select('quantity costPrice itemName');

        console.log('All items for total value calculation:', allItems);

        totalValue = allItems.reduce((sum, item) => {
          const quantity = Number(item.quantity) || 0;
          const costPrice = Number(item.costPrice) || 0;
          const itemValue = quantity * costPrice;

          console.log(`Item: ${item.itemName}, Quantity: ${quantity}, Cost: ${costPrice}, Value: ${itemValue}`);

          return sum + itemValue;
        }, 0);

        console.log('Final total value calculation:', totalValue);
      } catch (calculationError) {
        console.error('Error in total value calculation:', calculationError);
        totalValue = 0;
      }

      console.log('Final stats:', {
        totalItems,
        lowStockItems,
        expiringItems,
        totalValue,
      });

      return {
        totalItems,
        lowStockItems,
        expiringItems,
        totalValue,
      }
    } catch (error) {
      console.error('Error in getInventoryStats:', error);
      // Return default values on error
      return {
        totalItems: 0,
        lowStockItems: 0,
        expiringItems: 0,
        totalValue: 0,
      };
    }
  }

  async searchInventoryItems(
    clinicId: mongoose.Types.ObjectId,
    query: string,
    category?: string,
    limit: number = 10
  ): Promise<IInventory[]> {
    try {
      if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID provided');
      }

      const searchQuery = query.trim();
      if (searchQuery.length < 2) {
        throw new Error('Search query must be at least 2 characters long');
      }

      // Build the search filter
      const filter: any = {
        clinicId: clinicId,
        deletedAt: null,
        isActive: true,
        $or: [
          { itemName: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { sku: { $regex: searchQuery, $options: 'i' } },
          { barcode: { $regex: searchQuery, $options: 'i' } },
        ],
      };

      // Add category filter if provided and not empty
      if (category && category.trim() !== '') {
        filter.category = category;
      }

      // Add quantity filter to only show items with stock (commented out for testing)
      // filter.quantity = { $gt: 0 };

            console.log('Search filter:', JSON.stringify(filter, null, 2));

      // Debug: Check what categories exist in the database
      const allItems = await Inventory.find({
        clinicId: clinicId,
        deletedAt: null,
      }).select('itemName category');

      console.log('All items in database:', allItems.map(item => ({ name: item.itemName, category: item.category })));

      const items = await Inventory.find(filter)
        .select('itemName description category quantity unit costPrice sellingPrice sku barcode')
        .sort({ itemName: 1 })
        .limit(limit);

      console.log('Search results:', items.length, 'items found');

      return items;
    } catch (error) {
      throw error;
    }
  }

  async debugTotalValue(clinicId: mongoose.Types.ObjectId): Promise<any> {
    try {
      // Get all inventory items for debugging
      const allItems = await this.getInventoryByClinic(clinicId)

      // Calculate total value manually for comparison
      const manualTotalValue = allItems.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0
        const costPrice = Number(item.costPrice) || 0
        const itemValue = quantity * costPrice
        console.log(`Debug - Item: ${item.itemName}, Quantity: ${item.quantity} (${typeof item.quantity}), Cost: ${item.costPrice} (${typeof item.costPrice}), Value: ${itemValue}`)
        return sum + itemValue
      }, 0)

      const stats = await this.getInventoryStats(clinicId)

      return {
        allItems: allItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          quantityType: typeof item.quantity,
          costPrice: item.costPrice,
          costPriceType: typeof item.costPrice,
          itemValue: (Number(item.quantity) || 0) * (Number(item.costPrice) || 0)
        })),
        manualTotalValue,
        statsTotalValue: stats.totalValue,
        stats
      };
    } catch (error) {
      throw error;
    }
  }

  async debugAllItems(clinicId: mongoose.Types.ObjectId): Promise<IInventory[]> {
    try {
      if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID provided');
      }

      const items = await Inventory.find({
        clinicId: clinicId,
        deletedAt: null,
      }).select('itemName description category quantity unit costPrice sellingPrice sku barcode isActive');

      console.log('Debug all items:', items.length, 'items found for clinic:', clinicId);

      return items;
    } catch (error) {
      throw error;
    }
  }
}
