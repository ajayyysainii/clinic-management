import { Request, Response } from 'express'
import { ServicesService } from '../services'
import mongoose from 'mongoose'
import { ServiceCategory } from '../models'
import { AuthenticatedRequest } from '../../../types'

export class ServicesController {
  private ServicesService: ServicesService

  constructor() {
    this.ServicesService = new ServicesService()
  }

  createService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        serviceName,
        description,
        category,
        basePrice,
        sellingPrice,
        duration,
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

      const serviceData = {
        serviceName,
        description,
        category: category || ServiceCategory.OTHER,
        basePrice: Number(basePrice) || 0,
        sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
        duration: duration ? Number(duration) : 30,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      }

      const result = await this.ServicesService.createService({
        ...serviceData,
        clinicId,
      })

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: result,
      })
    } catch (error: any) {
      console.error('Service creation error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create service',
      })
    }
  }

  getServicesByClinic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const services = await this.ServicesService.getServicesByClinic(clinicId)

      res.status(200).json({
        success: true,
        message: 'Services list fetched successfully',
        data: services,
        count: services.length,
      })
    } catch (error: any) {
      console.error('Get services error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch services',
      })
    }
  }

  getServiceById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const service = await this.ServicesService.getServiceById(id, clinicId)

      if (!service) {
        res.status(404).json({
          success: false,
          message: 'Service not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Service fetched successfully',
        data: service,
      })
    } catch (error: any) {
      console.error('Get service by ID error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch service',
      })
    }
  }

  updateService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const clinicId = req.currentUser?.clinic
      const updateData = req.body

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const updatedService = await this.ServicesService.updateService(id, clinicId, updateData)

      if (!updatedService) {
        res.status(404).json({
          success: false,
          message: 'Service not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: updatedService,
      })
    } catch (error: any) {
      console.error('Update service error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update service',
      })
    }
  }

  deleteService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const deletedService = await this.ServicesService.deleteService(id, clinicId)

      if (!deletedService) {
        res.status(404).json({
          success: false,
          message: 'Service not found',
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Service deleted successfully',
        data: deletedService,
      })
    } catch (error: any) {
      console.error('Delete service error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete service',
      })
    }
  }

  getServicesStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const clinicId = req.currentUser?.clinic

      if (!clinicId) {
        res.status(400).json({
          success: false,
          error: 'Clinic information is required',
        })
        return
      }

      const stats = await this.ServicesService.getServicesStats(clinicId)

      res.status(200).json({
        success: true,
        message: 'Services statistics fetched successfully',
        data: stats,
      })
    } catch (error: any) {
      console.error('Get services stats error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch services statistics',
      })
    }
  }

  searchServices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      console.log('Service search request:', { clinicId, query: searchQuery, category, limit })

      const result = await this.ServicesService.searchServices(
        clinicId,
        searchQuery.trim(),
        category as string,
        Number(limit)
      )

      console.log('Service search response:', { resultCount: result.length, result })

      res.status(200).json({
        success: true,
        message: 'Services found successfully',
        data: result,
        count: result.length,
      })
    } catch (error: any) {
      console.error('Search services error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search services',
      })
    }
  }
}
