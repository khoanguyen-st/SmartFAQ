// apps/web-admin/src/services/user.services.ts
import { API_BASE_URL } from '@/lib/api'
// Import thêm Department interface từ types
import type { Department } from '@/types/users'

export interface UserProfile {
  id: number
  username: string
  email: string
  phoneNumber: string
  address: string
  avatar_url: string | null
  // Thêm departments vào profile (tuỳ chọn)
  departments?: Department[]
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || ''
  return {
    Authorization: `Bearer ${token}`
  }
}

const getImageUrl = (fileKey: string | null): string | null => {
  if (!fileKey) return null
  if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
    return fileKey
  }
  return `${API_BASE_URL}/api/user/files/${fileKey}`
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
    headers: {
      ...getAuthHeaders()
    }
  })

  if (!res.ok) throw new Error('Failed to fetch profile')

  const data = await res.json()

  return {
    id: userId,
    username: data.username,
    email: data.email,
    phoneNumber: data.phone || '',
    address: data.address || '',
    avatar_url: getImageUrl(data.image),
    // Map dữ liệu department từ backend (nếu có)
    departments: data.departments || []
  }
}

// ... (Các hàm updateUserProfile, uploadAvatar, deleteAvatar, changePassword giữ nguyên như cũ)
export async function updateUserProfile(userId: number, data: Partial<UserProfile>): Promise<{ status: string }> {
  const payload: Record<string, unknown> = {}

  if (data.username !== undefined) payload.username = data.username
  if (data.address !== undefined) payload.address = data.address
  if (data.phoneNumber !== undefined) payload.phone = data.phoneNumber

  const res = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) throw new Error('Failed to update profile')
  return res.json()
}

export async function uploadAvatar(userId: number, file: File): Promise<{ status: string; image: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE_URL}/api/user/${userId}/avatar`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    body: formData
  })

  if (!res.ok) throw new Error('Failed to upload avatar')

  const data = await res.json()
  return {
    status: data.status,
    image: getImageUrl(data.item?.image) || ''
  }
}

export async function deleteAvatar(userId: number): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/user/${userId}/avatar`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  })

  if (!res.ok) throw new Error('Failed to delete avatar')
  return res.json()
}

export async function changePassword(userId: number, data: ChangePasswordRequest): Promise<{ status: string }> {
  const formData = new FormData()
  formData.append('current_password', data.current_password)
  formData.append('new_password', data.new_password)
  formData.append('confirm_password', data.confirm_password)

  const res = await fetch(`${API_BASE_URL}/api/user/${userId}/change-password`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    body: formData
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Failed to change password')
  }

  return res.json()
}
