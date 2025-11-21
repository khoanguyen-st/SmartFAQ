// Simple auth helper for development
// Store token in localStorage

const TOKEN_KEY = 'auth_token'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function login(username: string, password: string): Promise<string> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
  
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Login failed' }))
    throw new Error(error.detail || 'Login failed')
  }
  
  const data = await res.json()
  setAuthToken(data.access_token)
  return data.access_token
}
