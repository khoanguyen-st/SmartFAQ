import ChatHeader from '@/components/ui/ChatHeader'
import ChatMessageList from '@/components/ui/ChatMessageList'
import ChatInput from '@/components/ui/ChatInput'
import { ChatHistoryMessage } from '@/services/chat.services'
import { FC } from 'react'

interface ChatContainerProps {
  messages: ChatHistoryMessage[]
  isLoading: boolean
  onSend: (msg: string) => void
  headerAction?: React.ReactNode
  headerAdditionalActions?: React.ReactNode
  sessionId?: string | null
}

export const ChatContainer: FC<ChatContainerProps> = ({
  messages,
  isLoading,
  onSend,
  headerAction,
  headerAdditionalActions,
  sessionId
}) => {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <ChatHeader actionNode={headerAction} additionalActions={headerAdditionalActions} />
      <ChatMessageList messages={messages} isLoading={isLoading} sessionId={sessionId || null} />
      <ChatInput onSend={onSend} isLoading={isLoading} />
    </div>
  )
}
