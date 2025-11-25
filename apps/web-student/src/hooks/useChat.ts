import { useCallback, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export interface Message {
  id: string
  author: 'user' | 'assistant'
  content: string
  timestamp: string
}

export const useChat = () => {
  const [history, setHistory] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const userMessage: Message = {
      id: crypto.randomUUID(),
      author: 'user',
      content,
      timestamp
    }
    setHistory(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      // Call SmartFAQ API
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content,
          conversation_id: sessionStorage.getItem('conversation_id') || undefined
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Save conversation ID for session continuity
      if (data.conversation_id) {
        sessionStorage.setItem('conversation_id', data.conversation_id)
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        author: 'assistant',
        content: data.response || data.message || 'Sorry, I could not process your request.',
        timestamp: new Date().toLocaleTimeString()
      }
      setHistory(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)

      // Show error message in chat
      const errorResponse: Message = {
        id: crypto.randomUUID(),
        author: 'assistant',
        content: `Sorry, an error occurred: ${errorMessage}. Please try again.`,
        timestamp: new Date().toLocaleTimeString()
      }
      setHistory(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { history, sendMessage, isLoading, error }
}
