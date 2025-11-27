import { mockApi } from './api.mock'
import type { UserListResponse, UserQuery, User, CreateUserRequest } from '@/types/users'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

function getValidBaseUrl(): string {
  const envBase = import.meta.env.VITE_API_BASE_URL
  try {
    if (envBase && /^https?:\/\/.+/.test(envBase)) {
      return envBase
    }
    if (envBase) {
      console.warn('VITE_API_BASE_URL is set but invalid:', envBase)
    }
  } catch (e) {
    console.warn('Error validating VITE_API_BASE_URL:', e)
  }
  return 'http://localhost:8000'
}

const REAL_BASE = getValidBaseUrl()
type FetchOptions = Parameters<typeof fetch>[1]

async function realFetch(path: string, init?: FetchOptions): Promise<unknown> {
  const res = await fetch(`${REAL_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const apiClient = {
  async listUsers(params: UserQuery = {}): Promise<UserListResponse> {
    if (USE_MOCK) return mockApi.listUsers(params)
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('page_size', String(params.pageSize))
    if (params.search) query.set('search', params.search)
    return realFetch(`/api/admin/users?${query.toString()}`) as Promise<UserListResponse>
  },
  async createUser(data: CreateUserRequest): Promise<User> {
    if (USE_MOCK) return mockApi.createUser(data)
    return realFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }) as Promise<User>
  },
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    if (USE_MOCK) return mockApi.updateUser(id, data)
    return realFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }) as Promise<User>
  },
  async lockUser(id: number): Promise<void> {
    if (USE_MOCK) return mockApi.lockUser(id)
    await realFetch(`/api/admin/users/${id}/lock`, { method: 'POST' })
  },
  async unlockUser(id: number): Promise<void> {
    if (USE_MOCK) return mockApi.unlockUser(id)
    await realFetch(`/api/admin/users/${id}/unlock`, { method: 'POST' })
  },
  async resetUserPassword(id: number): Promise<void> {
    if (USE_MOCK) return mockApi.resetUserPassword(id)
    await realFetch(`/api/admin/users/${id}/reset-password`, { method: 'POST' })
  }
}

export const api = {
  listUsers: apiClient.listUsers,
  createUser: apiClient.createUser,
  updateUser: apiClient.updateUser,
  lockUser: apiClient.lockUser,
  unlockUser: apiClient.unlockUser,
  resetUserPassword: apiClient.resetUserPassword
}

export type { User, CreateUserRequest }
export default apiClient
