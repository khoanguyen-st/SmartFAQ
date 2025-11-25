import { useCallback } from 'react'
import { ChatService } from '@/services/chat.service'
import { Message } from '@/hooks/useChat'

export const useExpandChat = () => {
  /**
   * Handles the logic for expanding the chat.
   * @param messages - The current list of messages to be saved (if any).
   */
  const expandToFullPage = useCallback(async (messages: Message[] = []) => {
    try {
      let targetUrl = '/full-chat'

      if (messages.length > 0) {
        const sessionId = await ChatService.saveSession(messages)
        targetUrl = `/full-chat?session_id=${sessionId}`
      }

      window.open(targetUrl, '_blank')
    } catch (error) {
      console.error('Failed to save session and expand chat:', error)
      window.open('/full-chat', '_blank')
    }
  }, [])

  return { expandToFullPage }
}