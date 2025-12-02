import { API_BASE_URL } from '@/lib/api'

export interface UserProfile {
  id: number
  username: string
  email: string
  phoneNumber: string
  address: string
  avatar_url: string | null
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

// Helper to get JWT headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken') || ''
  return {
    Authorization: `Bearer ${token}`
  }
}

/** ----------------------------------------
 * GET USER PROFILE:  GET /staff/{id}
 * -----------------------------------------*/
export async function getUserProfile(userId: number): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/staff/${userId}`, {
    headers: {
      ...getAuthHeaders()
    }
  })

  if (!res.ok) throw new Error('Failed to fetch profile')

  const data = await res.json()

  // Map backend snake_case to frontend camelCase
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    phoneNumber: data.phone_number || data.phoneNumber || '',
    address: data.address || '',
    avatar_url: data.avatar_url || null
  }
}

/** ----------------------------------------
 * UPDATE PROFILE: PUT /staff/{id}
 * -----------------------------------------*/
export async function updateUserProfile(userId: number, data: Partial<UserProfile>): Promise<{ status: string }> {
  // Map frontend camelCase to backend snake_case for payload
  const payload: Record<string, unknown> = { ...data }
  if (data.phoneNumber) {
    payload.phone_number = data.phoneNumber
    delete payload.phoneNumber
  }

  const res = await fetch(`${API_BASE_URL}/staff/${userId}`, {
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

/** ----------------------------------------
 * UPLOAD AVATAR: POST /staff/{id}/avatar
 * -----------------------------------------*/
export async function uploadAvatar(userId: number, file: File): Promise<{ status: string; item: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE_URL}/staff/${userId}/avatar`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
      // Do NOT manually set Content-Type for FormData; browser handles it
    },
    body: formData
  })

  if (!res.ok) throw new Error('Failed to upload avatar')
  return res.json()
}

/** ----------------------------------------
 * DELETE AVATAR: DELETE /staff/{id}/avatar
 * -----------------------------------------*/
export async function deleteAvatar(userId: number): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/staff/${userId}/avatar`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  })

  if (!res.ok) throw new Error('Failed to delete avatar')
  return res.json()
}

/** ----------------------------------------
 * CHANGE PASSWORD: POST /staff/{id}/change-password
 * -----------------------------------------*/
export async function changePassword(userId: number, data: ChangePasswordRequest): Promise<{ status: string }> {
  const formData = new FormData()
  formData.append('current_password', data.current_password)
  formData.append('new_password', data.new_password)
  formData.append('confirm_password', data.confirm_password)

  const res = await fetch(`${API_BASE_URL}/staff/${userId}/change-password`, {
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
