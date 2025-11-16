export type UserRole = 'Super Admin' | 'Admin' | 'Staff' | 'Viewer'
export type UserStatus = 'active' | 'locked' | 'inactive'

export interface User {
  id: number
  username: string
  email: string
  phone_number?: string
  role: UserRole
  status: UserStatus
  created_at?: string
  updated_at?: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  role?: UserRole
}

export interface CreateUserResponse {
  user_id: number
  username: string
  role: UserRole
  status: UserStatus
  message: string
}

export interface UpdateUserResponse {
  user_id: number
  username: string
  email: string
  role: UserRole
  status: UserStatus
  message: string
}

export interface ApiError {
  error: string
}
