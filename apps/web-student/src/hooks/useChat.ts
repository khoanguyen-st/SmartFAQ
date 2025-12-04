import { useState, useEffect, useCallback, useRef } from 'react'
import { useI18n } from '@/lib/i18n'
import {toast} from 'react-hot-toast'
import { startNewChatSession, sendChatMessage, getChatHistory, ChatHistoryMessage } from '@/services/chat.services'

const CUSTOM_WELCOME_MSG = 'Xin chào!\nTôi là trợ lý ảo Greenwich (Smart FAQ)'
const SYNC_CHANNEL_NAME = 'greenwich_chat_sync_channel'
const STORAGE_KEY = 'chat_session_id'

export const useChat = (initialSessionId?: string | null) => {

  const { t } = useI18n()

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ref checking call API
  const isFetchingRef = useRef(false)

  // Ref use to storage messages hiện tại nhằm so sánh khi sync (tránh re-render thừa)
  const messagesRef = useRef<ChatHistoryMessage[]>([])
  messagesRef.current = messages

  // 1. FETCH HISTORY
  const fetchHistory = useCallback(async (currentId: string) => {
    if (isFetchingRef.current || !currentId) return

    try {
      isFetchingRef.current = true
      const history = await getChatHistory(currentId)

      if (history.messages.length === 0) {
        setMessages([
          {
            role: 'system',
            text: CUSTOM_WELCOME_MSG,
            timestamp: new Date().toISOString()
          }
        ])
      }
      else if (history.messages.length !== messagesRef.current.length) {
        setMessages(history.messages)
      }
    } catch (err) {
      console.error('Fetch history error:', err)
      // 3. Hiển thị Toast Error khi fetch lỗi (Xử lý cho cả BroadcastChannel & Visibility)
      toast.error(t('errorFetch'))
    } finally {
      isFetchingRef.current = false
    }
  }, [t])

  // 2. INIT SESSION
  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true)
      try {
        let targetId = initialSessionId

        if (!targetId) {
          targetId = localStorage.getItem(STORAGE_KEY)
        }

        if (targetId) {
          setSessionId(targetId)
          await fetchHistory(targetId)
        } else {
          const newSession = await startNewChatSession()
          setSessionId(newSession.sessionId)
          localStorage.setItem(STORAGE_KEY, newSession.sessionId)
          setMessages([
            {
              role: 'system',
              text: CUSTOM_WELCOME_MSG,
              timestamp: new Date().toISOString()
            }
          ])
        }
      } catch (err) {
        setError(t('errorConnect'))
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [initialSessionId, fetchHistory, t])

  // 3. SYNC EVENTS
  useEffect(() => {
    if (!sessionId) return

    try {
        const channel = new BroadcastChannel(SYNC_CHANNEL_NAME)
        
        channel.onmessage = event => {

          if (event.data?.type === 'NEED_REFRESH') {

            fetchHistory(sessionId)
          }
        }

        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            fetchHistory(sessionId)
          }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        
        return () => {
          channel.close()
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    } catch (error) {
        console.error("BroadcastChannel not supported or failed:", error)
    }
  }, [sessionId, fetchHistory, t])

  //4. SEND MESSAGE
  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || !sessionId) return

      // Optimistic UI
      const userMsg: ChatHistoryMessage = {
        role: 'user',
        text: question,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, userMsg])
      setIsLoading(true)

      try {
        const response = await sendChatMessage(sessionId, question)

        // Cập nhật câu trả lời từ Bot
        const botMsg: ChatHistoryMessage = {
          role: 'assistant',
          text: response.answer,
          timestamp: new Date().toISOString(),
          chatId: response.chatId,
          confidence: response.confidence
        }
        setMessages(prev => [...prev, botMsg])

        // Báo cho các tab khác biết
        const channel = new BroadcastChannel(SYNC_CHANNEL_NAME)
        channel.postMessage({ type: 'NEED_REFRESH' })
        channel.close()
      } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(errorMessage)
      toast.error(t('errorSend'))
      setError(t('errorSend'))
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId, t]
  )

  // 5. CLEAR CHAT
  const clearChat = async () => {
    setSessionId(null)

    const welcomeMsg: ChatHistoryMessage = {
      role: 'system',
      text: CUSTOM_WELCOME_MSG,
      timestamp: new Date().toISOString()
    }
    setMessages([welcomeMsg])
    messagesRef.current = [welcomeMsg]

    setIsLoading(true)
    try {
      // 1. Xóa session cũ khỏi Storage
      localStorage.removeItem(STORAGE_KEY)

      // 2. Tạo session mới
      const newSession = await startNewChatSession()
      setSessionId(newSession.sessionId)

      // 3. Lưu session MỚI vào Storage
      localStorage.setItem(STORAGE_KEY, newSession.sessionId)

      // 4. Báo cho các tab khác biết (để chúng nó cũng reload/clear theo)
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME)
      channel.postMessage({ type: 'NEED_REFRESH' })
      channel.close()
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
