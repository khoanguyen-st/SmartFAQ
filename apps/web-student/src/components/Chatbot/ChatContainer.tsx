import ChatHeader from '@/components/ui/ChatHeader'
import ChatMessageList from '@/components/ui/ChatMessageList'
import ChatInput from '@/components/ui/ChatInput'
import FAQSuggestions from '@/components/ui/FAQSuggestions'
import { ChatHistoryMessage } from '@/services/chat.services'

interface ChatContainerProps {
  messages: ChatHistoryMessage[]
  isLoading: boolean
  onSend: (msg: string) => void
  headerAction?: React.ReactNode
  headerAdditionalActions?: React.ReactNode
  sessionId?: string | null
  onQuestionClick?: (question: string) => void
}

export const ChatContainer = ({
  messages,
  isLoading,
  onSend,
  headerAction,
  headerAdditionalActions,
  sessionId,
  onQuestionClick
}: ChatContainerProps) => {
  // Show FAQ suggestions only when there are no user messages yet
  const showFAQs = messages.filter(m => m.role === 'user').length === 0 && !isLoading && onQuestionClick

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <ChatHeader actionNode={headerAction} additionalActions={headerAdditionalActions} />
      <ChatMessageList messages={messages} isLoading={isLoading} sessionId={sessionId || null} />
      {showFAQs && (
        <div className="max-h-64 shrink-0 overflow-y-auto border-t border-slate-100 bg-slate-50">
          <FAQSuggestions onQuestionClick={onQuestionClick} language="vi" />
        </div>
      )}
      <ChatInput onSend={onSend} isLoading={isLoading} />
    </div>
  )
}
