import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export const validateLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
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
