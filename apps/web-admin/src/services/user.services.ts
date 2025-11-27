import { API_BASE_URL } from '@/lib/api'

export interface UserProfile {
  username: string
  email: string
  phoneNumber: string
  address: string
  image: string | null
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

// Helper lấy header (sẽ cập nhật kỹ hơn khi có file backend)
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken') || '' // Tạm thời
  return {
    Authorization: `Bearer ${token}`
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  })
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update profile')
  return res.json()
}

export async function uploadAvatar(file: File): Promise<{ image: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE_URL}/api/users/profile/avatar`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
      // Note: Không set Content-Type khi dùng FormData, browser tự handle boundary
    },
    body: formData
  })
  if (!res.ok) throw new Error('Failed to upload avatar')
  return res.json()
}

export async function deleteAvatar(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/users/profile/avatar`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  })
  if (!res.ok) throw new Error('Failed to delete avatar')
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/users/change-password`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || 'Failed to change password')
  }
}
