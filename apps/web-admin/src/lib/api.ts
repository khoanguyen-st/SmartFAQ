import { getAuthToken } from './auth'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Helper to get headers with auth token
function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

// API client with error handling
async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

// ============ User Management API ============

export interface User {
  id: number // Backend uses int, not string
  username: string
  email: string
  role: 'Admin' | 'SuperAdmin' // Backend uses 'Admin' not 'Staff'
  status: 'Active' | 'Locked'
  phoneNumber?: string | null
  address?: string | null
  image?: string | null
  created_at?: string // Backend uses snake_case
}

export interface CreateUserRequest {
  email: string
  password: string
  role: 'Admin' // Backend only allows 'Admin' role
  status: 'Active' | 'Locked'
  phoneNumber?: string | null
  address?: string | null
  image?: string | null
}

export interface UpdateUserRequest {
  email?: string
  role?: 'Admin'
  phoneNumber?: string | null
  address?: string | null
  image?: string | null
}

// Fetch all users
export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to load users' }))
    throw new Error(error.error || 'Failed to load users')
  }
  return res.json()
}

// Create new user
export async function createUser(data: CreateUserRequest): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to create user' }))
    throw new Error(error.error || 'Failed to create user')
  }
  return res.json()
}

// Update user
export async function updateUser(userId: number, data: UpdateUserRequest): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to update user' }))
    throw new Error(error.error || 'Failed to update user')
  }
  return res.json()
}

// Reset user password
export async function resetUserPassword(userId: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to reset password' }))
    throw new Error(error.error || 'Failed to reset password')
  }
  // Backend returns 204 No Content
  return { message: 'Password reset email sent successfully' }
}

// Lock user
export async function lockUser(userId: number): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/lock`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to lock user' }))
    throw new Error(error.error || 'Failed to lock user')
  }
  return res.json()
}

// Unlock user
export async function unlockUser(userId: number): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unlock`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to unlock user' }))
    throw new Error(error.error || 'Failed to unlock user')
  }
  return res.json()
}
