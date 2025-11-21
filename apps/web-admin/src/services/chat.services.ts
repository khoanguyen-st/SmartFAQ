import { API_BASE_URL } from '@/lib/api';

export interface ChatSource {
  title: string;
  chunkId?: string | null;
  relevance?: number | null;
}

export interface NewSessionResponse {
  sessionId: string;
  message: string;
}

export interface ChatQueryResponse {
  answer: string;
  sources: ChatSource[];
  confidence: number;
  language: string;
  fallback: boolean;
  chatId: string;
}

export interface FeedbackRequest {
  chatId: string;
  sessionId: string;
  feedback: 'up' | 'down';
  comment?: string;
}

export interface FeedbackResponse {
  status: string;
  message: string;
}

export interface ChatHistoryMessage {
  role: string;
  text: string;
  timestamp: string;
  chatId?: string | null;
  confidence?: number | null;
  fallback?: boolean | null;
}

export interface ChatHistoryResponse {
  sessionId: string;
  messages: ChatHistoryMessage[];
}

export interface ChatSourcesResponse {
  chatId: string;
  sources: ChatSource[];
}

export interface ChatConfidenceResponse {
  chatId: string;
  confidence: number;
  threshold: number;
  fallbackTriggered: boolean;
}

// --- API Service Functions ---

/**
 * Starts a new chat session.
 */
export async function startNewChatSession(): Promise<NewSessionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/new-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language
    })
  });
  if (!res.ok) {
    console.error('Failed to start new chat session', res);
    throw new Error('Failed to start new chat session');
  }
  return res.json();
}

/**
 * Sends a user's question to the chat API.
 */
export async function sendChatMessage(sessionId: string, question: string): Promise<ChatQueryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId,
      question
    })
  });
  if (!res.ok) {
    console.error('Failed to send message', res);
    throw new Error('Failed to send message');
  }
  return res.json();
}

/**
 * Fetches the chat history for a given session.
 */
export async function getChatHistory(sessionId: string, limit: number = 50): Promise<ChatHistoryResponse> {
  const params = new URLSearchParams({ sessionId, limit: String(limit) });
  const res = await fetch(`${API_BASE_URL}/api/chat/history?${params.toString()}`);

  if (!res.ok) {
    console.error('Failed to fetch chat history', res);
    throw new Error('Failed to fetch chat history');
  }
  return res.json();
}

/**
 * Submits user feedback (up/down vote) for a specific chat message.
 */
export async function submitChatFeedback(payload: FeedbackRequest): Promise<FeedbackResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.error('Failed to submit feedback', res);
    throw new Error('Failed to submit feedback');
  }
  return res.json();
}

/**
 * Retrieves the list of sources for a specific assistant message.
 */
export async function getChatSources(chatId: string): Promise<ChatSourcesResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/sources/${chatId}`);
  if (!res.ok) {
    console.error('Failed to fetch chat sources', res);
    throw new Error('Failed to fetch chat sources');
  }
  return res.json();
}

/**
 * Retrieves the confidence score for a specific assistant message.
 */
export async function getChatConfidence(chatId: string): Promise<ChatConfidenceResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/confidence/${chatId}`);
  if (!res.ok) {
    console.error('Failed to fetch chat confidence', res);
    throw new Error('Failed to fetch chat confidence');
  }
  return res.json();
}
