export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

type FetchOptions = {
  method?: string
  headers?: Record<string, string>
  body?: string
  credentials?: 'include' | 'omit' | 'same-origin'
  mode?: 'cors' | 'no-cors' | 'same-origin'
  cache?: 'default' | 'no-cache' | 'reload' | 'force-cache' | 'only-if-cached'
}

async function apiClient<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(error.message || `HTTP ${res.status}: ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Network error occurred')
  }
}

export async function fetchMetrics(): Promise<Record<string, unknown>> {
  return apiClient<Record<string, unknown>>('/admin/metrics')
}

export interface User {
  id: string
  username: string
  email: string
  campus: 'DN' | 'HCM' | 'HN' | 'CT'
  departments: string[]
  role: 'Staff' | 'SuperAdmin'
  status: 'Active' | 'Locked'
  phoneNumber?: string | null
  address?: string | null
  image?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserRequest {
  username: string
  email: string
  campus: 'DN' | 'HCM' | 'HN' | 'CT'
  departments: string[]
  role: 'Staff'
  password: string
  status: 'Active' | 'Locked'
  phoneNumber?: string | null
  address?: string | null
  image?: string | null
}

export interface UpdateUserRequest {
  username?: string
  campus?: 'DN' | 'HCM' | 'HN' | 'CT'
  departments?: string[]
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to load users' }))
    throw new Error(error.error || 'Failed to load users')
  }
  return res.json()
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  if (!data.departments || data.departments.length === 0) {
    throw new Error('At least one department must be assigned.')
  }

  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to create user' }))

    if (error.error?.includes('already exists') || error.error?.includes('duplicate')) {
      throw new Error('Username or email already exists.')
    }
    throw new Error(error.error || 'Failed to create user')
  }
  return res.json()
}

export async function updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
  if (data.departments !== undefined && data.departments.length === 0) {
    throw new Error('At least one department must be assigned.')
  }

  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to update user' }))

    if (error.error?.includes('already exists') || error.error?.includes('duplicate')) {
      throw new Error('Username or email already exists.')
    }
    throw new Error(error.error || 'Failed to update user')
  }
  return res.json()
}

export async function resetUserPassword(userId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to reset password' }))
    throw new Error(error.error || 'Failed to reset password')
  }
  return res.json()
}

export async function lockUser(userId: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/lock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to lock user' }))
    throw new Error(error.error || 'Failed to lock user')
  }
  return res.json()
}

export async function unlockUser(userId: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unlock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to unlock user' }))
    throw new Error(error.error || 'Failed to unlock user')
  }
  return res.json()
}
