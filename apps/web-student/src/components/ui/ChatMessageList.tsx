import { useEffect, useRef } from 'react'
import AssistantMessage from './AssistantMessage'
import { ChatHistoryMessage } from '@/services/chat.services'

import FAQSuggestions from './FAQSuggestions'

interface ChatMessageListProps {
  messages: ChatHistoryMessage[]
  isLoading: boolean
  sessionId: string | null
  onQuestionClick?: (question: string) => void
}

const ChatMessageList = ({ messages, isLoading, sessionId, onQuestionClick }: ChatMessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Show suggestions only if there is just the Welcome message (or no messages)
  const showSuggestions = messages.length <= 1 && !!onQuestionClick

  return (
    <div className="chat__content relative z-0 flex flex-1 flex-col overflow-y-auto scroll-smooth py-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user'

        if (isUser) {
          return (
            <div key={index} className="message message--receiver">
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          )
        }

        if (msg.role === 'system') {
          return (
            <div key={index} className="mb-4 flex items-end-safe justify-center text-center">
              <p className="text-sm whitespace-pre-wrap text-[#a6a6a6]">{msg.text}</p>
            </div>
          )
        }

        return <AssistantMessage key={index} message={msg} sessionId={sessionId} />
      })}

      {showSuggestions && onQuestionClick && <FAQSuggestions onQuestionClick={onQuestionClick} language="vi" />}

      {isLoading && (
        <div className="message message--sender">
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-150"></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-300"></span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

export default ChatMessageList
