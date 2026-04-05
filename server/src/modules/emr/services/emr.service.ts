import mongoose, { Types } from 'mongoose'
import EMR from '../models/emr.model'

interface PaginationOptions {
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface SearchOptions {
  query: string
  searchBy: string
  page: number
  limit: number
  clinicId?: string
  doctorId?: string
  startDate?: string
  endDate?: string
}

interface PaginatedResult {
  emrs: any[]
  currentPage: number
  totalPages: number
  totalRecords: number
  hasNext: boolean
  hasPrev: boolean
}

export class EmrService {
  // Create new EMR record
  async createEmr(emrData: any) {
    try {
      const newEmr = new EMR(emrData)
      const savedEmr = await newEmr.save()
      return await this.populateEmrReferences(savedEmr)
    } catch (error) {
      console.error('Error creating EMR in service:', error)
      throw error
    }
  }

  // Get EMR by ID
  async getEmrById(id: string) {
    try {
      const emr = await EMR.findById(id)
      if (!emr) return null

      return await this.populateEmrReferences(emr)
    } catch (error) {
      console.error('Error retrieving EMR by ID in service:', error)
      throw error
    }
  }

  // Get all EMRs for a specific user with pagination
  async getEmrsByUserId(userId: string, options: PaginationOptions): Promise<PaginatedResult> {
    try {
      const { page, limit, sortBy, sortOrder } = options
      const skip = (page - 1) * limit

      const sortOptions: any = {}
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

      const [emrs, totalRecords] = await Promise.all([
        EMR.find({ user: userId })
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('user', 'name email')
          .populate('clinic', 'name location')
          .populate('doctor', 'name specialization')
          .exec(),
        EMR.countDocuments({ user: userId }),
      ])

      const totalPages = Math.ceil(totalRecords / limit)

      return {
        emrs,
        currentPage: page,
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    } catch (error) {
      console.error('Error retrieving EMRs by user ID in service:', error)
      throw error
    }
  }

  // Get all EMRs for a specific clinic with pagination
  async getEmrsByClinicId(clinicId: string, options: PaginationOptions): Promise<PaginatedResult> {
    try {
      const { page, limit, sortBy, sortOrder } = options
      const skip = (page - 1) * limit

      const sortOptions: any = {}
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

      const [emrs, totalRecords] = await Promise.all([
        EMR.find({ clinic: clinicId })
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('user', 'name email')
          .populate('clinic', 'name location')
          .populate('doctor', 'name specialization')
          .exec(),
        EMR.countDocuments({ clinic: clinicId }),
      ])

      const totalPages = Math.ceil(totalRecords / limit)

      return {
        emrs,
        currentPage: page,
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    } catch (error) {
      console.error('Error retrieving EMRs by clinic ID in service:', error)
      throw error
    }
  }

  // Get all EMRs for a specific doctor with pagination
  async getEmrsByDoctorId(doctorId: string, options: PaginationOptions): Promise<PaginatedResult> {
    try {
      const { page, limit, sortBy, sortOrder } = options
      const skip = (page - 1) * limit

      const sortOptions: any = {}
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

      const [emrs, totalRecords] = await Promise.all([
        EMR.find({ doctor: doctorId })
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('user', 'name email')
          .populate('clinic', 'name location')
          .populate('doctor', 'name specialization')
          .exec(),
        EMR.countDocuments({ doctor: doctorId }),
      ])

      const totalPages = Math.ceil(totalRecords / limit)

      return {
        emrs,
        currentPage: page,
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    } catch (error) {
      console.error('Error retrieving EMRs by doctor ID in service:', error)
      throw error
    }
  }

  // Update EMR record
  async updateEmr(id: string, updateData: any) {
    try {
      const updatedEmr = await EMR.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })

      if (!updatedEmr) return null

      return await this.populateEmrReferences(updatedEmr)
    } catch (error) {
      console.error('Error updating EMR in service:', error)
      throw error
    }
  }

  // Delete EMR record
  async deleteEmr(id: string) {
    try {
      const deletedEmr = await EMR.findByIdAndDelete(id)
      return deletedEmr
    } catch (error) {
      console.error('Error deleting EMR in service:', error)
      throw error
    }
  }

  // Search EMRs
  async searchEmrs(options: SearchOptions): Promise<PaginatedResult> {
    try {
      const { query, searchBy, page, limit, clinicId, doctorId, startDate, endDate } = options
      const skip = (page - 1) * limit

      // Build search filters
      const searchFilters: any = {}

      // Add clinic filter if provided
      if (clinicId && Types.ObjectId.isValid(clinicId)) {
        searchFilters.clinic = clinicId
      }

      // Add doctor filter if provided
      if (doctorId && Types.ObjectId.isValid(doctorId)) {
        searchFilters.doctor = doctorId
      }

      // Add date range filter if provided
      if (startDate || endDate) {
        searchFilters.createdAt = {}
        if (startDate) {
          searchFilters.createdAt.$gte = new Date(startDate)
        }
        if (endDate) {
          searchFilters.createdAt.$lte = new Date(endDate)
        }
      }

      // Build text search based on searchBy parameter
      const textSearchFilters: any = {}
      switch (searchBy) {
        case 'name':
          textSearchFilters['basicInfo.name'] = { $regex: query, $options: 'i' }
          break
        case 'phoneNumber':
          textSearchFilters['basicInfo.phoneNumber'] = { $regex: query, $options: 'i' }
          break
        case 'diagnosis':
          textSearchFilters['diagnosis.diagnosisName'] = { $regex: query, $options: 'i' }
          break
        case 'chiefComplaint':
          textSearchFilters['history.chiefComplaint'] = { $regex: query, $options: 'i' }
          break
        default:
          // Default search across multiple fields
          textSearchFilters.$or = [
            { 'basicInfo.name': { $regex: query, $options: 'i' } },
            { 'basicInfo.phoneNumber': { $regex: query, $options: 'i' } },
            { 'diagnosis.diagnosisName': { $regex: query, $options: 'i' } },
            { 'history.chiefComplaint': { $regex: query, $options: 'i' } },
          ]
      }

      const combinedFilters = { ...searchFilters, ...textSearchFilters }

      const [emrs, totalRecords] = await Promise.all([
        EMR.find(combinedFilters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('user', 'name email')
          .populate('clinic', 'name location')
          .populate('doctor', 'name specialization')
          .exec(),
        EMR.countDocuments(combinedFilters),
      ])

      const totalPages = Math.ceil(totalRecords / limit)

      return {
        emrs,
        currentPage: page,
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    } catch (error) {
      console.error('Error searching EMRs in service:', error)
      throw error
    }
  }

  // Add diagnosis to existing EMR
  async addDiagnosis(id: string, diagnosisData: any) {
    try {
      const updatedEmr = await EMR.findByIdAndUpdate(
        id,
        { $push: { diagnosis: diagnosisData } },
        { new: true, runValidators: true },
      )

      if (!updatedEmr) return null

      return await this.populateEmrReferences(updatedEmr)
    } catch (error) {
      console.error('Error adding diagnosis in service:', error)
      throw error
    }
  }

  // Add immunization to existing EMR
  async addImmunization(id: string, immunizationData: any) {
    try {
      const updatedEmr = await EMR.findByIdAndUpdate(
        id,
        { $push: { immunization: immunizationData } },
        { new: true, runValidators: true },
      )

      if (!updatedEmr) return null

      return await this.populateEmrReferences(updatedEmr)
    } catch (error) {
      console.error('Error adding immunization in service:', error)
      throw error
    }
  }

  // Get patient history summary
  async getPatientHistorySummary(userId: string) {
    try {
      const emrs = await EMR.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('doctor', 'name specialization')
        .populate('clinic', 'name location')
        .exec()

      if (emrs.length === 0) {
        return {
          totalVisits: 0,
          lastVisit: null,
          commonDiagnoses: [],
          activeMedications: [],
          allergies: [],
          chronicConditions: [],
          immunizations: [],
        }
      }

      // Calculate summary data
      const totalVisits = emrs.length
      const lastVisit = emrs[0]

      // Get all diagnoses and find most common ones
      const allDiagnoses = emrs.flatMap((emr) => emr.diagnosis.map((d) => d.diagnosisName).filter(Boolean))
      const diagnosisCount = allDiagnoses.reduce((acc: any, diagnosis) => {
        acc[diagnosis!] = (acc[diagnosis!] || 0) + 1
        return acc
      }, {})
      const commonDiagnoses = Object.entries(diagnosisCount)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([diagnosis, count]) => ({ diagnosis, count }))

      // Get active medications from past history
      const activeMedications = emrs
        .flatMap((emr) => emr.history.pastHistory)
        .filter((ph) => ph.onMedication === 'Yes')
        .map((ph) => ({
          condition: ph.sufferingFrom,
          medications: ph.drugName,
          prescribedBy: ph.prescribedBy,
        }))

      // Get all allergies
      const allergies = emrs
        .flatMap((emr) => [
          ...emr.history.allergies.pastAllergyPrescription,
          ...emr.history.allergies.newAllergyPrescription,
        ])
        .map((allergy) => ({
          allergyName: allergy.allergyName,
          symptoms: allergy.symptoms,
          triggers: allergy.triggers,
        }))

      // Get chronic conditions from past history
      const chronicConditions = emrs
        .flatMap((emr) => emr.history.pastHistory)
        .filter((ph) => ph.onMedication === 'Yes' || ph.onMedication === 'Diet controlled')
        .map((ph) => ({
          condition: ph.sufferingFrom,
          diagnosedIn: ph.diagnosedIn,
          onMedication: ph.onMedication,
        }))

      // Get all immunizations
      const immunizations = emrs
        .flatMap((emr) => emr.immunization)
        .map((imm) => ({
          vaccinationName: imm.vaccinationName,
          immunizationType: imm.immunizationType,
          totalDose: imm.totalDose,
          completedDoses: imm.doseDates.filter((dose) => dose.status === 'completed').length,
        }))

      return {
        totalVisits,
        lastVisit: {
          date: lastVisit.createdAt,
          doctor: lastVisit.doctor,
          clinic: lastVisit.clinic,
          chiefComplaint: lastVisit.history.chiefComplaint,
        },
        commonDiagnoses,
        activeMedications: activeMedications.slice(0, 10), // Limit to 10 most recent
        allergies: Array.from(new Set(allergies.map((a) => JSON.stringify(a))))
          .map((a) => JSON.parse(a))
          .slice(0, 10),
        chronicConditions: Array.from(new Set(chronicConditions.map((c) => JSON.stringify(c))))
          .map((c) => JSON.parse(c))
          .slice(0, 10),
        immunizations: Array.from(new Set(immunizations.map((i) => JSON.stringify(i))))
          .map((i) => JSON.parse(i))
          .slice(0, 10),
      }
    } catch (error) {
      console.error('Error getting patient history summary in service:', error)
      throw error
    }
  }

  // Helper method to populate EMR references
  private async populateEmrReferences(emr: any) {
    return await EMR.findById(emr._id)
      .populate('user', 'name email phoneNumber')
      .populate('clinic', 'name location address contactNumber')
      .populate('doctor', 'name specialization qualification contactNumber')
      .exec()
  }

  // Get EMR statistics for a clinic
  async getClinicStatistics(clinicId: string) {
    try {
      const [totalPatients, totalVisits, recentVisits, diagnosisStats] = await Promise.all([
        EMR.distinct('user', { clinic: clinicId }).then((users) => users.length),
        EMR.countDocuments({ clinic: clinicId }),
        EMR.countDocuments({
          clinic: clinicId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        }),
        EMR.aggregate([
          { $match: { clinic: new Types.ObjectId(clinicId) } },
          { $unwind: '$diagnosis' },
          { $group: { _id: '$diagnosis.diagnosisName', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ])

      return {
        totalPatients,
        totalVisits,
        recentVisits,
        topDiagnoses: diagnosisStats,
      }
    } catch (error) {
      console.error('Error getting clinic statistics in service:', error)
      throw error
    }
  }

  // Get EMR statistics for a doctor
  async getDoctorStatistics(doctorId: string) {
    try {
      const [totalPatients, totalVisits, recentVisits, diagnosisStats, consultationModes] = await Promise.all([
        EMR.distinct('user', { doctor: doctorId }).then((users) => users.length),
        EMR.countDocuments({ doctor: doctorId }),
        EMR.countDocuments({
          doctor: doctorId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        }),
        EMR.aggregate([
          { $match: { doctor: new Types.ObjectId(doctorId) } },
          { $unwind: '$diagnosis' },
          { $group: { _id: '$diagnosis.diagnosisName', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        EMR.aggregate([
          { $match: { doctor: new Types.ObjectId(doctorId) } },
          { $group: { _id: '$consultationMode', count: { $sum: 1 } } },
        ]),
      ])

      return {
        totalPatients,
        totalVisits,
        recentVisits,
        topDiagnoses: diagnosisStats,
        consultationModes,
      }
    } catch (error) {
      console.error('Error getting doctor statistics in service:', error)
      throw error
    }
  }

  // Get patients due for follow-up
  async getFollowUpDuePatients(doctorId?: string, clinicId?: string) {
    try {
      const filter: any = {}

      if (doctorId) filter.doctor = doctorId
      if (clinicId) filter.clinic = clinicId

      // Get EMRs with follow-up schedules
      const emrsWithFollowUp = await EMR.find({
        ...filter,
        followUpSchedule: { $exists: true, $nin: [null, ''] },
      })
        .populate('user', 'name phoneNumber')
        .populate('doctor', 'name')
        .populate('clinic', 'name')
        .sort({ createdAt: -1 })

      // Filter based on follow-up date (this is a simplified version)
      // In a real implementation, you'd parse the followUpSchedule properly
      const today = new Date()
      const followUpDue = emrsWithFollowUp.filter((emr) => {
        // This is a simplified check - you'd need to parse the actual follow-up date
        return emr.followUpSchedule && emr.followUpSchedule.includes('days')
      })

      return followUpDue.map((emr) => ({
        patientName: emr.basicInfo.name,
        patientPhone: emr.basicInfo.phoneNumber,
        lastVisit: emr.createdAt,
        followUpSchedule: emr.followUpSchedule,
        doctor: emr.doctor,
        clinic: emr.clinic,
      }))
    } catch (error) {
      console.error('Error getting follow-up due patients in service:', error)
      throw error
    }
  }

  // Get patients with pending immunizations
  async getPendingImmunizations(doctorId?: string, clinicId?: string) {
    try {
      const filter: any = {}

      if (doctorId) filter.doctor = doctorId
      if (clinicId) filter.clinic = clinicId

      const emrsWithImmunizations = await EMR.find({
        ...filter,
        'immunization.0': { $exists: true },
      })
        .populate('user', 'name phoneNumber')
        .populate('doctor', 'name')
        .populate('clinic', 'name')

      const pendingImmunizations: any[] = []

      emrsWithImmunizations.forEach((emr) => {
        emr.immunization.forEach((imm) => {
          const pendingDoses = imm.doseDates.filter((dose) => dose.status === 'due')
          if (pendingDoses.length > 0) {
            pendingImmunizations.push({
              patientName: emr.basicInfo.name,
              patientPhone: emr.basicInfo.phoneNumber,
              vaccinationName: imm.vaccinationName,
              pendingDoses: pendingDoses.length,
              dueDates: pendingDoses.map((dose) => dose.date),
              doctor: emr.doctor,
              clinic: emr.clinic,
            })
          }
        })
      })

      return pendingImmunizations
    } catch (error) {
      console.error('Error getting pending immunizations in service:', error)
      throw error
    }
  }

  // Export patient data
  async exportPatientData(userId: string, format: 'json' | 'summary' = 'json') {
    try {
      const emrs = await EMR.find({ user: userId })
        .populate('doctor', 'name specialization')
        .populate('clinic', 'name location')
        .sort({ createdAt: -1 })
        .exec()

      if (format === 'summary') {
        // Return a summarized version
        return {
          patientInfo: emrs[0]?.basicInfo || {},
          totalVisits: emrs.length,
          visitSummaries: emrs.map((emr) => ({
            date: emr.createdAt,
            doctor: emr.doctor,
            clinic: emr.clinic,
            chiefComplaint: emr.history.chiefComplaint,
            diagnoses: emr.diagnosis.map((d) => d.diagnosisName),
            advice: emr.advice,
          })),
          allergies: emrs.flatMap((emr) => [
            ...emr.history.allergies.pastAllergyPrescription,
            ...emr.history.allergies.newAllergyPrescription,
          ]),
          chronicConditions: emrs.flatMap((emr) => emr.history.pastHistory),
          immunizations: emrs.flatMap((emr) => emr.immunization),
        }
      }

      // Return full data
      return emrs
    } catch (error) {
      console.error('Error exporting patient data in service:', error)
      throw error
    }
  }

  // Bulk update EMR records
  async bulkUpdateEmrs(updates: Array<{ id: string; data: any }>) {
    try {
      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { _id: update.id },
          update: { $set: update.data },
          upsert: false,
        },
      }))

      const result = await EMR.bulkWrite(bulkOps)
      return result
    } catch (error) {
      console.error('Error bulk updating EMRs in service:', error)
      throw error
    }
  }

  // Get EMR analytics
  async getAnalytics(filter: any = {}) {
    try {
      const [totalRecords, recordsByMonth, diagnosisDistribution, consultationModeDistribution, ageGroupDistribution] =
        await Promise.all([
          EMR.countDocuments(filter),
          EMR.aggregate([
            { $match: filter },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 },
          ]),
          EMR.aggregate([
            { $match: filter },
            { $unwind: '$diagnosis' },
            { $group: { _id: '$diagnosis.diagnosisName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
          ]),
          EMR.aggregate([{ $match: filter }, { $group: { _id: '$consultationMode', count: { $sum: 1 } } }]),
          EMR.aggregate([
            { $match: filter },
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      { case: { $lt: ['$basicInfo.age', 18] }, then: '0-17' },
                      { case: { $lt: ['$basicInfo.age', 35] }, then: '18-34' },
                      { case: { $lt: ['$basicInfo.age', 50] }, then: '35-49' },
                      { case: { $lt: ['$basicInfo.age', 65] }, then: '50-64' },
                      { case: { $gte: ['$basicInfo.age', 65] }, then: '65+' },
                    ],
                    default: 'Unknown',
                  },
                },
                count: { $sum: 1 },
              },
            },
          ]),
        ])

      return {
        totalRecords,
        recordsByMonth,
        diagnosisDistribution,
        consultationModeDistribution,
        ageGroupDistribution,
      }
    } catch (error) {
      console.error('Error getting analytics in service:', error)
      throw error
    }
  }
}
