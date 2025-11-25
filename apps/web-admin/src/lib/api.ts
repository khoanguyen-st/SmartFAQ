export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Helper function để gọi API với authentication
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }))
    const errorMessage = errorData.detail?.error || errorData.detail || res.statusText
    throw new Error(errorMessage)
  }
  
  return res.json()
}

// Auth functions
export interface LoginResponse {
  access_token: string
  token_type?: string
}

// Thêm type cho campus code
export type CampusCode = "DN" | "HCM" | "HN" | "CT";

// Update login function để nhận email, password, và campus_id
export async function login(
  email: string, 
  password: string, 
  campusId: CampusCode
): Promise<LoginResponse> {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ 
      email, 
      password, 
      campus_id: campusId 
    }),
  })
}

export async function logout(): Promise<void> {
  await apiCall('/auth/logout', {
    method: 'POST',
  })
  localStorage.removeItem('access_token')
}

export interface ForgotPasswordResponse {
  message: string
  reset_token: string
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return apiCall('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export interface ResetPasswordResponse {
  message: string
}

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
  return apiCall('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
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