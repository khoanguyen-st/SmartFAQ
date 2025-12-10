import type { User } from '@/types/users'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const accessToken = localStorage.getItem('access_token')
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options?.headers || {})
    }
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

export async function fetchUsers(role?: string): Promise<User[]> {
  const params = role ? `?role=${role}` : ''
  const data = await apiClient<{ items: User[] }>(`/api/user/${params}`)
  return data.items
}

export async function createUser(
  data: Omit<User, 'id' | 'failed_attempts' | 'locked_until' | 'is_locked' | 'created_at'> & { password: string }
): Promise<User> {
  const res = await apiClient<{ item: User }>(`/api/user/`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res.item
}

export async function updateUser(
  userId: number,
  data: Partial<User> & { password?: string; department_ids?: number[] }
): Promise<boolean> {
  // SỬA DÒNG NÀY: Thay đổi URL để khớp với admin.py ("/admin/{user_id}" mounted tại "/api/user")
  const res = await apiClient<{ status: string }>(`/api/user/admin/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return res.status === 'ok'
}

export async function lockUser(userId: number): Promise<boolean> {
  const res = await apiClient<{ status: string }>(`/api/user/${userId}/lock`, {
    method: 'PUT'
  })
  return res.status === 'locked'
}

export async function unlockUser(userId: number): Promise<boolean> {
  const res = await apiClient<{ status: string }>(`/api/user/${userId}/unlock`, {
    method: 'PUT'
  })
  return res.status === 'unlocked'
}

export async function resetUserPassword(userId: number, newPassword: string): Promise<boolean> {
  const res = await apiClient<{ status: string }>(`/api/user/${userId}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ password: newPassword })
  })
  return res.status === 'ok'
}
