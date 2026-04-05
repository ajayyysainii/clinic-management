import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { verifyJwtToken } from '../utils/token'
import { UserRepository } from '../modules/user/repository'

const userRepository = new UserRepository()

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const { email } = verifyJwtToken(token) as { email: string; password: string }

    const currentUser = await userRepository.findUserByEmail(email)

    if (!currentUser) {
      throw new Error('User not found')
    }

    req.currentUser = currentUser
    next()
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' })
  }
}
