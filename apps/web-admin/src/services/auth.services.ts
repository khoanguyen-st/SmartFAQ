import { API_BASE_URL } from '@/lib/api'

export interface Department {
  id: number
  name: string
}

export interface CurrentUserInfo {
  id: number
  username: string
  email: string
  role: string
  image: string | null
  departments: Department[]
}

// Helper to get JWT headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || ''
  return {
    Authorization: `Bearer ${token}`
  }
}
const getImageUrl = (fileKey: string | null): string | null => {
  if (!fileKey) return null
  // If it's already a full URL, return as is
  if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
    return fileKey
  }
  // Otherwise, build URL using the /api/user/files endpoint
  return `${API_BASE_URL}/api/user/files/${fileKey}`
}

/**
 * Get current user info with departments
 * GET /api/user/me
 */
export async function getCurrentUserInfo(): Promise<CurrentUserInfo> {
  const res = await fetch(`${API_BASE_URL}/api/user/me`, {
    headers: {
      ...getAuthHeaders()
    }
  })

  if (!res.ok) {
    throw new Error('Failed to fetch current user info')
  }

  const data = await res.json()
  return {
    ...data,
    image: getImageUrl(data.image)
  }
}

