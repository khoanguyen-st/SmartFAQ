export type UserStatus = 'Active' | 'Locked'

export interface User {
  id: number
  username: string
  email: string
  phoneNumber?: string | null
  role: string
  department?: string
  campus?: string
  status: UserStatus
}

export interface UserQuery {
  page?: number
  pageSize?: number
  search?: string
}

export interface UserListResponse {
  data: User[]
  metadata: {
    total: number
    currentPage: number
    pageSize: number
  }
}

export type CreateUserRequest = {
  username: string
  email: string
  phoneNumber?: string
  role?: string
  department?: string
  campus?: string
  status?: UserStatus
}