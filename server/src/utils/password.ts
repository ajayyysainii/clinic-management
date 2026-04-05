import * as bcrypt from 'bcrypt'

const saltRounds = 10

export const hashPassword = async (plaintext: string): Promise<string> => {
  return await bcrypt.hash(plaintext, saltRounds)
}

export const comparePassword = async (plaintext: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(plaintext, hash)
}

export const randomPassword = (digits = 8): string =>
  Math.random()
    .toString(36)
    .slice(-1 * digits)

export const randomHashedPassword = async (): Promise<string> => {
  const password = randomPassword()
  return await hashPassword(password)
}
