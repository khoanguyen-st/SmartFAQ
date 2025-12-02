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
 * GET USER PROFILE:  GET /api/user/{id}
 * -----------------------------------------*/
export async function getUserProfile(userId: number): Promise<UserProfile> {
  // FIX: Thêm /api vào đường dẫn và sửa /user -> /user cho đúng với backend
  const res = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
    headers: {
      ...getAuthHeaders()
    }
  })

  if (!res.ok) throw new Error('Failed to fetch profile')

  const data = await res.json()

  // Map backend fields (UserOut schema) to frontend interface
  return {
    id: userId, // Backend UserOut không trả về ID, lấy từ tham số
    username: data.username,
    email: data.email,
    // FIX: Backend trả về 'phone', Frontend dùng 'phoneNumber'
    phoneNumber: data.phone || '',
    address: data.address || '',
    // FIX: Backend trả về 'image', Frontend dùng 'avatar_url'
    avatar_url: data.image || null
  }
}

/** ----------------------------------------
 * UPDATE PROFILE: PUT /api/user/{id}
 * -----------------------------------------*/
export async function updateUserProfile(userId: number, data: Partial<UserProfile>): Promise<{ status: string }> {
  // Chỉ gửi những trường mà backend UserUpdate schema chấp nhận: username, phone, address
  const payload: Record<string, unknown> = {}

  if (data.username !== undefined) payload.username = data.username
  if (data.address !== undefined) payload.address = data.address
  // Map 'phoneNumber' frontend sang 'phone' backend
  if (data.phoneNumber !== undefined) payload.phone = data.phoneNumber

  // FIX: Thêm /api vào đường dẫn
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

/** ----------------------------------------
 * UPLOAD AVATAR: POST /api/user/{id}/avatar
 * -----------------------------------------*/
export async function uploadAvatar(userId: number, file: File): Promise<{ status: string; item: string }> {
  const formData = new FormData()
  formData.append('file', file)

  // FIX: Thêm /api vào đường dẫn
  const res = await fetch(`${API_BASE_URL}/api/user/${userId}/avatar`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
      // Không set Content-Type thủ công cho FormData
    },
    body: formData
  })

  if (!res.ok) throw new Error('Failed to upload avatar')
  return res.json()
}

/** ----------------------------------------
 * DELETE AVATAR: DELETE /api/user/{id}/avatar
 * -----------------------------------------*/
export async function deleteAvatar(userId: number): Promise<{ status: string }> {
  // FIX: Thêm /api vào đường dẫn
  const res = await fetch(`${API_BASE_URL}/api/user/${userId}/avatar`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  })

  if (!res.ok) throw new Error('Failed to delete avatar')
  return res.json()
}

/** ----------------------------------------
 * CHANGE PASSWORD: POST /api/user/{id}/change-password
 * -----------------------------------------*/
export async function changePassword(userId: number, data: ChangePasswordRequest): Promise<{ status: string }> {
  const formData = new FormData()
  formData.append('current_password', data.current_password)
  formData.append('new_password', data.new_password)
  formData.append('confirm_password', data.confirm_password)

  // FIX: Thêm /api vào đường dẫn
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
