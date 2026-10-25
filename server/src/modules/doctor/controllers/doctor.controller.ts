import { Request, Response } from 'express'
import DoctorMeta from '../models/doctor.model'
import CONSTANTS from '../../../utils/constants'
import mongoose from 'mongoose'
import { DoctorService } from '../services'
import { User } from '../../user/models'
import { AuthenticatedRequest } from '../../../types'

// Register a new doctor
const doctorService = new DoctorService()
export const registerDoctor = async (req: Request, res: Response): Promise<void> => {
  await doctorService.registerDoctor(req, res)
}

// Register hybrid doctor with existing user_id
export const registerHybridDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, bio, yearsOfExperience, degreeTitles, certificateTitles, specializations, availability } = req.body

    // Validate required fields
    if (!user_id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      })
      return
    }

    // Validate user_id format
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid User ID format',
      })
      return
    }

    // Check if user exists
    const user = await User.findById(user_id)
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      })
      return
    }

    // Check if doctor meta already exists for this user
    const existingDoctor = await DoctorMeta.findOne({ user_id })
    if (existingDoctor) {
      res.status(400).json({
        success: false,
        message: 'Doctor meta already exists for this user',
      })
      return
    }

    // Parse JSON fields if they are strings
    let parsedDegreeTitles = degreeTitles
    let parsedCertificateTitles = certificateTitles
    let parsedSpecializations = specializations
    let parsedAvailability = availability

    try {
      if (typeof degreeTitles === 'string') {
        parsedDegreeTitles = JSON.parse(degreeTitles)
      }
      if (typeof certificateTitles === 'string') {
        parsedCertificateTitles = JSON.parse(certificateTitles)
      }
      if (typeof specializations === 'string') {
        parsedSpecializations = JSON.parse(specializations)
      }
      if (typeof availability === 'string') {
        parsedAvailability = JSON.parse(availability)
      }
    } catch (parseError) {
      res.status(400).json({
        success: false,
        message: 'Invalid JSON format in request body',
      })
      return
    }

    // Handle file uploads
    let eSignUrl = ''
    let degreesData: any[] = []
    let certificatesData: any[] = []

    // Handle eSign file
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] }

      // Handle eSign
      if (files.eSign && files.eSign[0]) {
        const eSignFile = files.eSign[0] as any
        eSignUrl = eSignFile.location
      }

      // Handle degrees
      if (files.degrees && files.degrees.length > 0) {
        degreesData = files.degrees.map((file: any, index: number) => ({
          title: parsedDegreeTitles[index] || `Degree ${index + 1}`,
          degrees_image_url: file.location,
        }))
      }

      // Handle certificates
      if (files.certificates && files.certificates.length > 0) {
        certificatesData = files.certificates.map((file: any, index: number) => ({
          title: parsedCertificateTitles[index] || `Certificate ${index + 1}`,
          certificates_image_url: file.location,
        }))
      }
    }

    // Create new doctor meta
    const doctorMeta = new DoctorMeta({
      user_id,
      bio: bio || '',
      yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
      eSign: eSignUrl,
      degrees: degreesData,
      certificates: certificatesData,
      specializations: parsedSpecializations || [],
      availability: parsedAvailability || [],
    })

    const savedDoctor = await doctorMeta.save()

    res.status(201).json({
      success: true,
      message: 'Hybrid doctor registered successfully',
      data: savedDoctor,
    })
  } catch (error) {
    console.error('Error registering hybrid doctor:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to register hybrid doctor',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
//get doctor list
export const getDoctorList = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || CONSTANTS.DEFAULT_ITEMS_PER_PAGE
    const skip = (page - 1) * limit
    if (page < 1) {
      res.status(400).json({
        error: 'Page number must be greater than 0',
      })
      return
    }

    // Get total count of doctors with user_id
    const totalDoctors = await DoctorMeta.countDocuments({
      user_id: { $exists: true },
    })

    const doctorList = await DoctorMeta.find({
      user_id: { $exists: true },
    })
      .populate({
        path: 'user_id',
        match: { deletedAt: null },
      })
      .skip(skip)
      .limit(limit)

    const activeDoctorList = doctorList.filter((doctor) => doctor.user_id !== null)

    const totalPages = Math.ceil(totalDoctors / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    res.json({
      doctors: activeDoctorList,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalDoctors,
        hasNext,
        hasPrev,
        limit,
        skip,
      },
    })
  } catch (error) {
    console.error('Error fetching doctor list:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch doctor list',
    })
  }
}
//get doctor list of particular clinic
export const getDoctorListbyClinicId = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clinicId = req.currentUser?.clinic

    if (!clinicId) {
      res.status(400).json({
        success: false,
        error: 'Clinic information is required',
      })
      return
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || CONSTANTS.DEFAULT_ITEMS_PER_PAGE
    const skip = (page - 1) * limit

    if (page < 1) {
      res.status(400).json({
        error: 'Page number must be greater than 0',
      })
      return
    }

    // Get total count of doctors in this clinic
    const totalDoctors = await User.countDocuments({
      clinic: clinicId,
      roles: 'doctor',
      deletedAt: null,
    })

    // Find all doctors in this clinic
    const doctorsInClinic = await User.find({
      clinic: clinicId,
      roles: 'doctor',
      deletedAt: null,
    })
      .skip(skip)
      .limit(limit)

    // Get their meta information
    const doctorIds = doctorsInClinic.map((doctor) => doctor._id)
    const doctorMetaList = await DoctorMeta.find({
      user_id: { $in: doctorIds },
    }).populate('user_id')

    const totalPages = Math.ceil(totalDoctors / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    res.json({
      doctors: doctorMetaList,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalDoctors,
        hasNext,
        hasPrev,
        limit,
        skip,
      },
    })
  } catch (error) {
    console.error('Error fetching doctor list:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch doctor list',
    })
  }
}

// delete doctor
export const deleteDoctor = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      message: 'Invalid Doctor ID',
    })
    return
  }

  try {
    const doctor = await DoctorMeta.findById(id)

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
      return
    }

    const user = await User.findById(doctor.user_id)
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Associated user not found',
      })
      return
    }

    if (user.deletedAt) {
      res.status(400).json({
        success: false,
        message: 'Doctor is already deleted',
      })
      return
    }

    // Soft delete the associated user only
    await User.findByIdAndUpdate(doctor.user_id, {
      deletedAt: new Date(),
    })

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ error })
  }
}
//update doctor info
interface S3File extends Express.Multer.File {
  key: string
  location?: string
  etag?: string
  bucket?: string
}

export const updateDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid doctor Meta ID',
      })
      return
    }

    // Extract text fields from the request body
    const {
      name,
      email,
      phone,
      bio,
      yearsOfExperience,
      degreeTitles,
      certificateTitles,
      specializations,
      availability,
      existingESign,
      existingDegrees,
      existingCertificates,
      existingProfileImage,
      profileImageUrl,
    } = req.body

    // Helper function to safely parse JSON or return as-is if already parsed
    const safeJsonParse = (field: any, fallback: any = []) => {
      if (!field) return fallback;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (error) {
          console.error('JSON parse error for field:', field, error);
          // If it's a simple string that's not JSON, treat it as a single item array
          if (typeof field === 'string' && field.trim()) {
            return [field.trim()];
          }
          return fallback;
        }
      }
      return Array.isArray(field) ? field : fallback;
    };

    // Parse JSON fields safely
    const parsedDegreeTitles = safeJsonParse(degreeTitles, []);
    const parsedCertificateTitles = safeJsonParse(certificateTitles, []);
    const parsedSpecializations = safeJsonParse(specializations, []);
    const parsedAvailability = safeJsonParse(availability, []);
    const parsedExistingDegrees = safeJsonParse(existingDegrees, []);
    const parsedExistingCertificates = safeJsonParse(existingCertificates, []);

    // Type the files properly with S3 properties
    const files = req.files as {
      eSign?: S3File[]
      degrees?: S3File[]
      certificates?: S3File[]
      profileImageUrl?: S3File[]
    }

    // Find the doctor first
    const doctor = await DoctorMeta.findById(id).populate('user_id')
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      })
      return
    }

    // Prepare the update data - only include defined values
    const updateData: any = {}

    if (specializations !== undefined) {
      updateData.specializations = parsedSpecializations
    }

    if (availability !== undefined) {
      updateData.availability = parsedAvailability
    }

    // Only add fields if they are defined and not empty
    if (bio !== undefined && bio !== null) {
      updateData.bio = bio
    }

    if (yearsOfExperience !== undefined && yearsOfExperience !== null) {
      updateData.yearsOfExperience = Number(yearsOfExperience)
    }

    // Handle user data update - only update fields that are provided
    if (doctor.user_id) {
      const userUpdateData: any = {}

      if (name !== undefined && name !== null && name.trim() !== '') {
        userUpdateData.name = name.trim()
      }

      if (email !== undefined && email !== null && email.trim() !== '') {
        userUpdateData.email = email.trim()
      }

      if (phone !== undefined && phone !== null && phone.trim() !== '') {
        userUpdateData.phone = phone.trim()
      }

      if (files?.profileImageUrl?.[0]?.location) {
        userUpdateData.profileImageUrl = files.profileImageUrl[0].location
      } else if (typeof profileImageUrl === 'string' && profileImageUrl.trim() !== '') {
        userUpdateData.profileImageUrl = profileImageUrl.trim()
      } else if (typeof existingProfileImage === 'string' && existingProfileImage.trim() !== '') {
        userUpdateData.profileImageUrl = existingProfileImage.trim()
      }

      // Only update user if there's data to update
      if (Object.keys(userUpdateData).length > 0) {
        await User.findByIdAndUpdate(doctor.user_id, userUpdateData)
      }
    }

    // Handle eSign file only if files are present or existingESign is explicitly provided
    if (files && files.eSign && files.eSign[0]) {
      // New file uploaded
      updateData.eSign = files.eSign[0].location
    } else if (existingESign !== undefined) {
      // existingESign was explicitly provided (either with value or empty)
      if (existingESign && existingESign.trim() !== '') {
        // Keep existing file if no new file and existing file exists
        updateData.eSign = existingESign
      } else {
        // No file provided, set to empty string
        updateData.eSign = ''
      }
    }
    // If neither files nor existingESign are provided, don't modify eSign field

    // Handle degrees only if degree titles are provided
    if (parsedDegreeTitles.length > 0) {
      const updatedDegrees = []
      let degreeFileIndex = 0

      for (let i = 0; i < parsedDegreeTitles.length; i++) {
        const title = parsedDegreeTitles[i]
        let fileUrl = ''

        // Check if there's a new file for this degree
        if (files && files.degrees && degreeFileIndex < files.degrees.length) {
          fileUrl = files.degrees[degreeFileIndex].location ?? ''
          degreeFileIndex++
        }
        // If no new file, check for existing file
        else if (parsedExistingDegrees[i] && parsedExistingDegrees[i].trim() !== '') {
          fileUrl = parsedExistingDegrees[i]
        }

        // Only add degree if it has a title (file URL is optional)
        if (title && title.trim() !== '') {
          updatedDegrees.push({
            title: title.trim(),
            degrees_image_url: fileUrl,
          })
        }
      }

      updateData.degrees = updatedDegrees
    }

    // Handle certificates only if certificate titles are provided
    if (parsedCertificateTitles.length > 0) {
      const updatedCertificates = []
      let certificateFileIndex = 0

      for (let i = 0; i < parsedCertificateTitles.length; i++) {
        const title = parsedCertificateTitles[i]
        let fileUrl = ''

        // Check if there's a new file for this certificate
        if (files && files.certificates && certificateFileIndex < files.certificates.length) {
          fileUrl = files.certificates[certificateFileIndex].location ?? ''
          certificateFileIndex++
        }
        // If no new file, check for existing file
        else if (parsedExistingCertificates[i] && parsedExistingCertificates[i].trim() !== '') {
          fileUrl = parsedExistingCertificates[i]
        }

        // Only add certificate if it has a title (file URL is optional)
        if (title && title.trim() !== '') {
          updatedCertificates.push({
            title: title.trim(),
            certificates_image_url: fileUrl,
          })
        }
      }

      updateData.certificates = updatedCertificates
    }

    // Update the doctor meta data
    const updatedDoctor = await DoctorMeta.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('user_id')

    if (!updatedDoctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor Meta not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: updatedDoctor,
    })
  } catch (error) {
    console.error('Error updating doctor:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

//get doctor from user_id

export const getDoctorByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const doctor = await DoctorMeta.findOne({ user_id: userId }).populate('user_id')
    if (doctor) {
      res.json({
        success: true,
        message: 'Doctor retrieved successfully',
        data: doctor,
      })
      return
    }

    res.status(404).json({
      success: false,
      message: 'Doctor not found for this user ID',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}


export const listClinicDoctors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clinicId = req.currentUser?.clinic
    if (!clinicId) {
      res.status(400).json({
        success: false,
        message: 'Clinic not found for the current user.',
      })
      return;
    }

    const doctors = await User.find({
      clinic: clinicId,
      roles: 'doctor',
      deletedAt: null,
    })

    res.status(200).json({
      success: true,
      message: 'Doctors fetched successfully.',
      data: doctors,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching doctors.',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
