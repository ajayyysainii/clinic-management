import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET_KEY! as string
const defaultExpiry = '60d' as const

export const getJwtToken = (payload: object, expiry: SignOptions['expiresIn'] = defaultExpiry) => {
  const options: SignOptions = { expiresIn: expiry }
  return jwt.sign(payload, jwtSecret, options)
}

export const verifyJwtToken = (token: string) => {
  try {
    return jwt.verify(token, jwtSecret) as JwtPayload
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired')
    } else {
      throw new Error('Invalid token')
    }
  }
}
