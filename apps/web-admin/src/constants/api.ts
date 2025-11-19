// API URL constants

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const API_ENDPOINTS = {
  METRICS: '/admin/metrics',
  USERS: '/api/admin/users',
  USER_BY_ID: (id: number) => `/api/admin/users/${id}`
} as const
