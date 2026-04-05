import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    })
})

export const validateChangePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body, {
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
