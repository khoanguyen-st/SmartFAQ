// apps/web-admin/src/types/users.ts

// 1. Định nghĩa type cho Department
export interface Department {
  id: number
  name: string
}

export interface User {
  id: number
  username: string
  email: string
  phone?: string | null
  address?: string | null
  image?: string | null
  campus: string
  role: string
  failed_attempts: number
  locked_until?: string | null
  is_locked: boolean
  created_at: string
  departments: Department[]
}

export interface UserQuery {
  role?: string
}

export interface UserListResponse {
  items: User[]
}

export type CreateUserRequest = {
  username: string
  email: string
  password: string
  role: string
  campus: string
  phone?: string
  address?: string
  image?: string
  department_ids?: number[]
}
