export const Role = ['superadmin', 'admin', 'clinic-admin', 'clinic-head', 'doctor', 'patient','staff', 'hybrid'] as const

export type RoleType = (typeof Role)[number]

export interface IUserResponse {
  _id: string
  name: string
  email: string
  phone?: string
  roles: RoleType[]
  clinic?: string
  createdAt: Date
  updatedAt: Date
}
