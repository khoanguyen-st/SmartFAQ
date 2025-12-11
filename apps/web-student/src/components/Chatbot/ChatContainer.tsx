import ChatHeader from '@/components/ui/ChatHeader'
import ChatMessageList from '@/components/ui/ChatMessageList'
import ChatInput from '@/components/ui/ChatInput'
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
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <ChatHeader actionNode={headerAction} additionalActions={headerAdditionalActions} />
      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        sessionId={sessionId || null}
        onQuestionClick={onQuestionClick}
      />
      <ChatInput onSend={onSend} isLoading={isLoading} />
    </div>
  )
}
