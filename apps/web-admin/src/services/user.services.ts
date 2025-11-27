import { apiClient } from '@/lib/api.client'
import type { User, CreateUserRequest, UserQuery, UserListResponse } from '@/types/users'
import { validateDepartments } from '@/lib/validation'

const normalizeUser = (user: User): User => {
  const normalizedStatus = String(user.status).toLowerCase() === 'locked' ? 'Locked' : 'Active'
  return { ...user, status: normalizedStatus as User['status'] }
}

export class UserService {
  static async listUsers(params: UserQuery = {}): Promise<UserListResponse> {
    const response = await apiClient.listUsers(params)
    const normalizedUsers = response.data.map(normalizeUser)
    return {
      ...response,
      data: normalizedUsers
    }
  }

  static async createUser(payload: CreateUserRequest): Promise<User> {
    const deptError = validateDepartments(payload.departments)
    if (deptError) {
      throw new Error(deptError)
    }

    const user = await apiClient.createUser(payload)
    return normalizeUser(user)
  }

  static async updateUser(userId: number, payload: Partial<User>): Promise<User> {
    if (payload.departments !== undefined) {
      const deptError = validateDepartments(payload.departments)
      if (deptError) {
        throw new Error(deptError)
      }
    }

    const user = await apiClient.updateUser(userId, payload)
    return normalizeUser(user)
  }

  static async lockUser(userId: number): Promise<void> {
    await apiClient.lockUser(userId)
  }

  static async unlockUser(userId: number): Promise<void> {
    await apiClient.unlockUser(userId)
  }

  static async resetUserPassword(userId: number): Promise<void> {
    await apiClient.resetUserPassword(userId)
  }
}
