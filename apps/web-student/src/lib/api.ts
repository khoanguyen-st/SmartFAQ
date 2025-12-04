// Get API URL from widget config (if embedded) or env variable

const getApiBaseUrl = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).__CHAT_WIDGET_API_URL__) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).__CHAT_WIDGET_API_URL__
  }
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
}

export const API_BASE_URL = getApiBaseUrl()

// API client with error handling
async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(error.message || `HTTP ${res.status}: ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Network error occurred')
  }
}

export async function fetchMetrics(): Promise<Record<string, unknown>> {
  return apiClient<Record<string, unknown>>('/admin/metrics')
}
