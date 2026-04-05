import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

const doctorRegistrationSchema = Joi.object({
  bio: Joi.string().optional(),
  yearsOfExperience: Joi.number().min(0).optional(),
  eSign: Joi.string().optional(),
  degrees: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().optional(),
        degrees_image_url: Joi.string().uri().optional(),
      }),
    )
    .optional(),
  certificates: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().optional(),
        certificates_image_url: Joi.string().uri().optional(),
      }),
    )
    .optional(),
  specializations: Joi.array().items(Joi.string()).optional(),
  availability: Joi.array()
    .items(
      Joi.object({
        day: Joi.string()
          .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
          .optional(),
        slots: Joi.array().items(
          Joi.object({
            startTime: Joi.string().optional(),
            endTime: Joi.string().optional(),
          }),
        ),
      }),
    )
    .optional(),
})

export const validateDoctorRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = doctorRegistrationSchema.validate(req.body)

    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
      return
    }
    next()
  } catch (error) {
    next(error)
  }
}
