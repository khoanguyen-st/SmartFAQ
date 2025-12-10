export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

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
      const error = new Error(errorMessage) as Error & { status?: number; errorCode?: string }
      error.status = res.status
      error.errorCode = errorData.detail?.error_code
      throw error
    }

    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to API server at ${API_BASE_URL}.\nPlease check if the backend is running.`)
    }
    throw error
  }
}

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
  return apiCall('/api/dashboard/metrics')
}

export async function fetchLogs() {
  const response = await apiCall('/admin/logs')
  return response.items || []
}

// Dashboard API functions
export interface DashboardMetrics {
  questions_today: number
  avg_response_time_ms: number
  fallback_rate: number
  active_documents: number
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return apiCall('/api/dashboard/metrics')
}

export interface TrendDataPoint {
  period: string
  questions: number
  avg_confidence?: number
  fallback_count: number
}

export interface TrendsResponse {
  data: TrendDataPoint[]
}

export async function fetchWeeklyTrends(days: number = 7): Promise<TrendsResponse> {
  return apiCall(`/api/dashboard/trends?days=${days}`)
}

export interface UnansweredQuestion {
  id: number
  question: string
  reason: string
  channel?: string
  createdAt: string
  status: string
}

export interface UnansweredQuestionsResponse {
  items: UnansweredQuestion[]
  total: number
}

export async function fetchUnansweredQuestions(limit: number = 20): Promise<UnansweredQuestionsResponse> {
  return apiCall(`/api/dashboard/unanswered?limit=${limit}`)
}

// Query Logs API functions
export interface QueryLogItem {
  id: string
  sessionId: string
  question: string
  answer?: string
  confidence?: number
  relevance?: number
  fallback: boolean
  lang: string
  channel?: string
  userAgent?: string
  responseMs?: number
  feedback?: string
  timestamp: string
}

export interface QueryLogsResponse {
  items: QueryLogItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface QueryLogsFilters {
  page?: number
  pageSize?: number
  search?: string
  fallback?: boolean
  lang?: string
  channel?: string
}

export async function fetchQueryLogs(filters?: QueryLogsFilters): Promise<QueryLogsResponse> {
  const params = new URLSearchParams()

  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.pageSize) params.append('pageSize', String(filters.pageSize))
  if (filters?.search) params.append('search', filters.search)
  if (filters?.fallback !== undefined) params.append('fallback', String(filters.fallback))
  if (filters?.lang) params.append('lang', filters.lang)
  if (filters?.channel) params.append('channel', filters.channel)

  const queryString = params.toString()
  return apiCall(`/api/dashboard/logs${queryString ? `?${queryString}` : ''}`)
}

// Settings API functions
export interface SystemSettings {
  google_api_key: string
  llm_model: string
  llm_temperature: number
  llm_max_tokens: number
  confidence_threshold: number
  top_k_retrieval: number
  max_context_chars: number
  hybrid_enabled: boolean
  hybrid_k_vec: number
  hybrid_k_lex: number
}

export interface SettingsUpdateRequest {
  google_api_key?: string
  llm_temperature?: number
  llm_max_tokens?: number
  confidence_threshold?: number
  top_k_retrieval?: number
  max_context_chars?: number
  hybrid_enabled?: boolean
  hybrid_k_vec?: number
  hybrid_k_lex?: number
}

export interface SettingsUpdateResponse {
  success: boolean
  message: string
  updated_settings: SystemSettings
}

export async function fetchSystemSettings(): Promise<SystemSettings> {
  return apiCall('/api/settings')
}

export async function updateSystemSettings(data: SettingsUpdateRequest): Promise<SettingsUpdateResponse> {
  return apiCall('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}
