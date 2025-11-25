import { Message } from '@/hooks/useChat'

const STORAGE_KEY = 'smartfaq_sessions'

export interface ChatSessionData {
  id: string
  messages: Message[]
  timestamp: string
}

export const ChatService = {
  /**
   * AC 1.1 & 1.2: Lưu session hiện tại
   * Sau này thay bằng: return axios.post('/api/chat/session/save', { messages })
   */
  saveSession: async (messages: Message[]): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 300))

    const sessionId = crypto.randomUUID()
    
    const payload: ChatSessionData = {
      id: sessionId,
      messages,
      timestamp: new Date().toISOString()
    }

    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    sessions[sessionId] = payload
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))

    return sessionId
  },

  /**
   * AC 3.1: Lấy lại session cũ khi mở tab mới
   * Sau này thay bằng: return axios.get(`/api/chat/session/${sessionId}`)
   */
  getSession: async (sessionId: string): Promise<Message[] | null> => {
    // Giả lập độ trễ mạng
    await new Promise(resolve => setTimeout(resolve, 300))

    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const session = sessions[sessionId] as ChatSessionData

    return session ? session.messages : null
  }
}