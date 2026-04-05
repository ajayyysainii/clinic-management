import mongoose from 'mongoose'
import { Service, IService, ServiceCategory } from '../models'

interface ServiceData {
  serviceName: string
  description?: string
  category: ServiceCategory
  basePrice: number
  sellingPrice?: number
  duration?: number
  isActive?: boolean
}

export class ServicesService {
  async createService(data: ServiceData & { clinicId: mongoose.Types.ObjectId }): Promise<IService> {
    try {
      const service = new Service({
        ...data,
        isActive: data.isActive ?? true,
      })

      const savedService = await service.save()
      return savedService
    } catch (error) {
      throw error
    }
  }

  async getServicesByClinic(clinicId: mongoose.Types.ObjectId): Promise<IService[]> {
    try {
      const services = await Service.find({
        clinicId: clinicId,
        deletedAt: null,
      }).sort({ createdAt: -1 })

      return services
    } catch (error) {
      throw error
    }
  }

  async getServiceById(id: string, clinicId: mongoose.Types.ObjectId): Promise<IService | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid service ID format')
      }

      const service = await Service.findOne({
        _id: id,
        clinicId: clinicId,
        deletedAt: null,
      })

      return service
    } catch (error) {
      throw error
    }
  }

  async updateService(
    id: string,
    clinicId: mongoose.Types.ObjectId,
    updateData: Partial<ServiceData>,
  ): Promise<IService | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid service ID format')
      }

      const updatedService = await Service.findOneAndUpdate(
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

      return updatedService
    } catch (error) {
      throw error
    }
  }

  async deleteService(id: string, clinicId: mongoose.Types.ObjectId): Promise<IService | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid service ID format')
      }

      const deletedService = await Service.findOneAndUpdate(
        {
          _id: id,
          clinicId: clinicId,
          deletedAt: null,
        },
        {
          deletedAt: new Date(),
          isActive: false,
        },
        {
          new: true,
        },
      )

      return deletedService
    } catch (error) {
      throw error
    }
  }

  async getServicesStats(clinicId: mongoose.Types.ObjectId): Promise<{
    totalServices: number
    activeServices: number
    totalValue: number
    averagePrice: number
  }> {
    try {
      const services = await Service.find({
        clinicId: clinicId,
        deletedAt: null,
      })

      const totalServices = services.length
      const activeServices = services.filter(service => service.isActive).length
      const totalValue = services.reduce((sum, service) => sum + (service.sellingPrice || service.basePrice), 0)
      const averagePrice = totalServices > 0 ? totalValue / totalServices : 0

      return {
        totalServices,
        activeServices,
        totalValue,
        averagePrice,
      }
    } catch (error) {
      console.error('Error in getServicesStats:', error)
      return {
        totalServices: 0,
        activeServices: 0,
        totalValue: 0,
        averagePrice: 0,
      }
    }
  }

  async searchServices(
    clinicId: mongoose.Types.ObjectId,
    query: string,
    category?: string,
    limit: number = 10
  ): Promise<IService[]> {
    try {
      if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('Invalid clinic ID provided')
      }

      const searchQuery = query.trim()
      if (searchQuery.length < 2) {
        throw new Error('Search query must be at least 2 characters long')
      }

      // Build the search filter
      const filter: any = {
        clinicId: clinicId,
        deletedAt: null,
        isActive: true,
        $or: [
          { serviceName: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
        ],
      }

      // Add category filter if provided and not empty
      if (category && category.trim() !== '') {
        filter.category = category
      }

      const services = await Service.find(filter)
        .select('serviceName description category basePrice sellingPrice duration')
        .sort({ serviceName: 1 })
        .limit(limit)

      return services
    } catch (error) {
      throw error
    }
  }
}
