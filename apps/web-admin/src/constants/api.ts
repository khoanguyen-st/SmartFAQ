// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// API Endpoints
export const API_ENDPOINTS = {
  ADMIN_USERS: '/api/admin/users',
  ADMIN_METRICS: '/admin/metrics',
  CHAT_NEW_SESSION: '/api/chat/new-session',
  CHAT_QUERY: '/api/chat/query',
  CHAT_HISTORY: '/api/chat/history',
  CHAT_FEEDBACK: '/api/chat/feedback',
  CHAT_SOURCES: '/api/chat/sources',
  CHAT_CONFIDENCE: '/api/chat/confidence'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  FAILED_TO_FETCH_USERS: 'Failed to fetch users',
  FAILED_TO_CREATE_USER: 'Failed to create user',
  FAILED_TO_UPDATE_USER: 'Failed to update user',
  FAILED_TO_DELETE_USER: 'Failed to delete user',
  FAILED_TO_DELETE_FILE: 'Failed to delete file. Please try again.',
  CANNOT_CONNECT_API: 'Cannot connect to API at',
  SERVER_ERROR: 'Server error',
  CHECK_BACKEND: 'Please check if the backend server is running',
  UNABLE_TO_LOAD_FILE_INFO: 'Unable to load file information',
  FILE_NOT_FOUND: 'File not found',
  FAILED_TO_START_CHAT_SESSION: 'Failed to start new chat session',
  FAILED_TO_SEND_MESSAGE: 'Failed to send message',
  FAILED_TO_FETCH_CHAT_HISTORY: 'Failed to fetch chat history',
  FAILED_TO_SUBMIT_FEEDBACK: 'Failed to submit feedback',
  FAILED_TO_FETCH_CHAT_SOURCES: 'Failed to fetch chat sources',
  FAILED_TO_FETCH_CHAT_CONFIDENCE: 'Failed to fetch chat confidence'
} as const
