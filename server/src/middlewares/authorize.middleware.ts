import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { RoleType } from '../modules/user/types'

export const authorize = (allowedRoles: RoleType[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.currentUser

      if (!user) {
        res.status(401).json({ message: 'Access Denied: User not found' })
        return
      }

      // Debug logging
      console.log('Authorization check - User roles:', user.roles);
      console.log('Authorization check - Allowed roles:', allowedRoles);

      const hasRequiredRole = user.roles.some((role) => allowedRoles.includes(role) || role === 'admin')

      console.log('Authorization check - Has required role:', hasRequiredRole);

      if (!hasRequiredRole) {
        res.status(403).json({ message: 'Access Denied: You do not have the necessary permissions' })
        return
      }

      next()
    } catch (err: any) {
      res.status(500).json({ message: 'Internal Server Error', error: err.message })
    }
  }
}
