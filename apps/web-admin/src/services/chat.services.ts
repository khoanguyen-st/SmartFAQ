import { API_BASE_URL, API_ENDPOINTS, ERROR_MESSAGES } from '../constants/api'

export interface ChatSource {
  title: string
  chunkId?: string | null
  relevance?: number | null
}

export interface NewSessionResponse {
  sessionId: string
  message: string
}

export interface ChatQueryResponse {
  answer: string
  sources: ChatSource[]
  confidence: number
  language: string
  fallback: boolean
  chatId: string
}

export interface FeedbackRequest {
  chatId: string
  sessionId: string
  feedback: 'up' | 'down'
}

export interface FeedbackResponse {
  status: string
  message: string
}

export interface ChatHistoryMessage {
  role: string
  text: string
  timestamp: string
  chatId?: string | null
  confidence?: number | null
  fallback?: boolean | null
}

export interface ChatHistoryResponse {
  sessionId: string
  messages: ChatHistoryMessage[]
}

export interface ChatSourcesResponse {
  chatId: string
  sources: ChatSource[]
}

export interface ChatConfidenceResponse {
  chatId: string
  confidence: number
  threshold: number
  fallbackTriggered: boolean
}

// --- API Service Functions ---

/**
 * Starts a new chat session.
 */
export async function startNewChatSession(): Promise<NewSessionResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT_NEW_SESSION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language
    })
  })
  if (!res.ok) {
    console.error(ERROR_MESSAGES.FAILED_TO_START_CHAT_SESSION, res)
    throw new Error(ERROR_MESSAGES.FAILED_TO_START_CHAT_SESSION)
  }
  return res.json()
}

/**
 * Sends a user's question to the chat API.
 */
export async function sendChatMessage(sessionId: string, question: string): Promise<ChatQueryResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT_QUERY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId,
      question
    })
  })
  if (!res.ok) {
    console.error(ERROR_MESSAGES.FAILED_TO_SEND_MESSAGE, res)
    throw new Error(ERROR_MESSAGES.FAILED_TO_SEND_MESSAGE)
  }
  return res.json()
}

/**
 * Fetches the chat history for a given session.
 */
export async function getChatHistory(sessionId: string, limit: number = 50): Promise<ChatHistoryResponse> {
  const params = new URLSearchParams({ sessionId, limit: String(limit) })
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT_HISTORY}?${params.toString()}`)

  if (!res.ok) {
    console.error(ERROR_MESSAGES.FAILED_TO_FETCH_CHAT_HISTORY, res)
    throw new Error(ERROR_MESSAGES.FAILED_TO_FETCH_CHAT_HISTORY)
  }
  return res.json()
}

/**
 * Submits user feedback (up/down vote) for a specific chat message.
 */
export async function submitChatFeedback(payload: FeedbackRequest): Promise<FeedbackResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT_FEEDBACK}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    console.error(ERROR_MESSAGES.FAILED_TO_SUBMIT_FEEDBACK, res)
    throw new Error(ERROR_MESSAGES.FAILED_TO_SUBMIT_FEEDBACK)
  }
  return res.json()
}

/**
 * Retrieves the list of sources for a specific assistant message.
 */
export async function getChatSources(chatId: string): Promise<ChatSourcesResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT_SOURCES}/${chatId}`)
  if (!res.ok) {
    console.error(ERROR_MESSAGES.FAILED_TO_FETCH_CHAT_SOURCES, res)
    throw new Error(ERROR_MESSAGES.FAILED_TO_FETCH_CHAT_SOURCES)
  }
  return res.json()
}

/**
 * Retrieves the confidence score for a specific assistant message.
 */
export async function getChatConfidence(chatId: string): Promise<ChatConfidenceResponse> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT_CONFIDENCE}/${chatId}`)
  if (!res.ok) {
    console.error(ERROR_MESSAGES.FAILED_TO_FETCH_CHAT_CONFIDENCE, res)
    throw new Error(ERROR_MESSAGES.FAILED_TO_FETCH_CHAT_CONFIDENCE)
  }
  return res.json()
}
