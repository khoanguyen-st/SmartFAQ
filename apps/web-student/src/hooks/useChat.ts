import { useState, useEffect, useCallback } from 'react'
import { startNewChatSession, sendChatMessage, getChatHistory, ChatHistoryMessage } from '@/services/chat.services' // Đổi đường dẫn theo thực tế của bạn

const CUSTOM_WELCOME_MSG = 'Xin chào!\nTôi là trợ lý ảo Greenwich (Smart FAQ)'

export const useChat = (initialSessionId?: string | null) => {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Khởi tạo Session (Nếu chưa có ID thì tạo mới, có rồi thì load lịch sử)
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true)
        if (initialSessionId) {
          setSessionId(initialSessionId)
          const history = await getChatHistory(initialSessionId)
          setMessages(history.messages)
        } else {
          localStorage.removeItem('chat_session_id')

          const newSession = await startNewChatSession()
          setSessionId(newSession.sessionId)

          setMessages([
            {
              role: 'system',
              text: CUSTOM_WELCOME_MSG,
              timestamp: new Date().toISOString()
            }
          ])
        }
      } catch (err) {
        setError('Cannot connect to chat service.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [initialSessionId])

  // 2. Gửi tin nhắn
  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || !sessionId) return

      // Optimistic UI: Hiển thị tin nhắn user ngay lập tức
      const userMsg: ChatHistoryMessage = {
        role: 'user',
        text: question,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, userMsg])
      setIsLoading(true)

      try {
        const response = await sendChatMessage(sessionId, question)

        const botMsg: ChatHistoryMessage = {
          role: 'assistant',
          text: response.answer,
          timestamp: new Date().toISOString(),
          chatId: response.chatId,
          confidence: response.confidence
        }

        setMessages(prev => [...prev, botMsg])
      } catch (err) {
        setError(`Failed to send message : ${err instanceof Error ? err.message : 'Unknown error'}`)
        // Có thể thêm logic rollback tin nhắn user nếu muốn
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId]
  )

  // 3. Delete/Reset Chat
  const clearChat = async () => {
    setMessages([])
    setIsLoading(true)
    try {
      const newSession = await startNewChatSession()
      setSessionId(newSession.sessionId)

      setMessages([
        {
          role: 'system',
          text: CUSTOM_WELCOME_MSG,
          timestamp: new Date().toISOString()
        }
      ])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sessionId,
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat
  }
}
