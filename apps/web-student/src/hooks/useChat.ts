import { useCallback, useState } from 'react'

export interface Message {
  id: string
  author: 'user' | 'assistant'
  content: string
  timestamp: string
}

export const useChat = () => {
  const [history, setHistory] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

    // TODO: call SmartFAQ API once available
    await new Promise(resolve => setTimeout(resolve, 600))

    const response: Message = {
      id: crypto.randomUUID(),
      author: 'assistant',
      content: 'This is a placeholder response while the API is under development.',
      timestamp: new Date().toLocaleTimeString()
    }
    setHistory(prev => [...prev, response])
    setIsLoading(false)
  }, [])

  return { history, sendMessage, isLoading }
}
