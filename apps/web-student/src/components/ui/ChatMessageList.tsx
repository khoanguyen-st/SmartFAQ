import { useEffect, useRef } from 'react'
import AssistantMessage from './AssistantMessage'
import { ChatHistoryMessage } from '@/services/chat.services'

interface ChatMessageListProps {
  messages: ChatHistoryMessage[]
  isLoading: boolean
  sessionId: string | null
}

const ChatMessageList = ({ messages, isLoading, sessionId }: ChatMessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="chat__content relative flex flex-1 flex-col overflow-y-auto scroll-smooth p-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user'

        if (isUser) {
          return (
            <div key={index} className="mb-4 flex justify-end">
              <div className="message message--receiver">
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          )
        }

        if (msg.role === 'system') {
          return (
            <div key={index} className="mb-4 flex items-center justify-center text-center">
              <p className="text-sm whitespace-pre-wrap text-gray-400">{msg.text}</p>
            </div>
          )
        }

        return <AssistantMessage key={index} message={msg} sessionId={sessionId} />
      })}

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
