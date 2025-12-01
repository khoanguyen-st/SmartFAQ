export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Helper function để gọi API với authentication
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }))
      const errorMessage = errorData.detail?.error || errorData.detail || res.statusText
      throw new Error(errorMessage)
    }

    return res.json()
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to API server at ${API_BASE_URL}. Please check if the backend is running.`)
    }
    throw error
  }
}

// Auth functions
export interface LoginRequest {
  email: string
  password: string
  campus_id: 'DN' | 'HCM' | 'HN' | 'CT'
}

export interface LoginResponse {
  access_token: string
  token_type?: string
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function logout(): Promise<void> {
  await apiCall('/api/auth/logout', {
    method: 'POST'
  })
  localStorage.removeItem('access_token')
}

export interface ForgotPasswordResponse {
  message: string
  success?: boolean
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return apiCall('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  })
}

export interface ResetPasswordResponse {
  message: string
}

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
  return apiCall('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword })
  })
}

export async function verifyResetToken(token: string): Promise<{ valid: boolean; email: string }> {
  return apiCall('/api/auth/verify-reset-token', {
    method: 'POST',
    body: JSON.stringify({ token })
  })
}

// Admin functions
export async function fetchMetrics() {
  return apiCall('/admin/metrics')
}

export async function fetchLogs() {
  const response = await apiCall('/admin/logs')
  return response.items || []
}
