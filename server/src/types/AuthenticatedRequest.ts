import { Request } from 'express'
import { IUser } from '../modules/user/models/user.model'

interface AuthenticatedRequest extends Request {
  currentUser?: IUser
}

export default AuthenticatedRequest
