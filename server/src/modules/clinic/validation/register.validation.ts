import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

const availableLocationSchema = Joi.object({
  place: Joi.string().required(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
  googleMapUrl: Joi.string().uri().allow(''),
  status: Joi.string().valid('active', 'inactive').default('active'),
  membership: Joi.string(),
})

// Doctor data schema for individual clinics
const doctorDataSchema = Joi.object({
  name: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  phone: Joi.string().allow(''),
  bio: Joi.string().allow(''),
  yearsOfExperience: Joi.string().allow(''),
  specializations: Joi.string().allow(''),
  availability: Joi.string().allow(''),
  degreeTitles: Joi.string().allow(''),
  certificateTitles: Joi.string().allow(''),
})

export const registerClinicSchema = Joi.object({
  logo: Joi.string().allow(''),
  name: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  availableLocations: Joi.array().items(availableLocationSchema),
  website: Joi.string().uri().allow(''),
  ownerName: Joi.string().required(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  type: Joi.string().valid('individual', 'organization'),
  eSign: Joi.string().allow(''),
  membership: Joi.string(),
  haveCustomMembership: Joi.boolean().default(false),
  panNumber: Joi.string().allow(''),
  gstNumber: Joi.string().allow(''),
  doctor: doctorDataSchema.optional(),
})

export const updateClinicSchema = Joi.object({
  logo: Joi.string().allow(''),
  name: Joi.string().trim(),
  email: Joi.string().email(),
  phone: Joi.string(),
  availableLocations: Joi.array().items(availableLocationSchema),
  website: Joi.string().uri().allow(''),
  ownerName: Joi.string(),
  status: Joi.string().valid('active', 'inactive'),
  type: Joi.string().valid('individual', 'organization'),
  eSign: Joi.string().allow(''),
  membership: Joi.string(),
  haveCustomMembership: Joi.boolean(),
  panNumber: Joi.string().allow(''),
  gstNumber: Joi.string().allow(''),
})

export const validateClinicRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = registerClinicSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((err) => err.message),
      })
      return
    }

    // Replace request body with validated data
    req.body = value
    next()
  } catch (error) {
    next(error)
  }
}


