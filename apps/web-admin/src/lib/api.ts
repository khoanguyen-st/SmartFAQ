import type { CreateUserRequest, CreateUserResponse, UpdateUserRequest, UpdateUserResponse, User } from '@/types/user'
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api'

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.METRICS}`)
  if (!res.ok) throw new Error('Failed to load metrics')
  return res.json()
}

// User Management API
export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to create user' }))
      throw new Error(error.error || `Server error: ${res.status}`)
    }

    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to API at ${API_BASE_URL}. Please check if the backend server is running.`)
    }
    throw error
  }
}

export async function updateUser(userId: number, data: UpdateUserRequest): Promise<UpdateUserResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_BY_ID(userId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to update user' }))
      throw new Error(error.error || `Server error: ${res.status}`)
    }

    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to API at ${API_BASE_URL}. Please check if the backend server is running.`)
    }
    throw error
  }
}

export async function deleteUser(userId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_BY_ID(userId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to delete user')
  }
}
