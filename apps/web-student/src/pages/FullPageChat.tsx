import { useSearchParams } from 'react-router-dom'

import { useChat } from '@/hooks/useChat'
import { ChatContainer } from '@/components/Chatbot/ChatContainer'

import TrashIcon from '@/assets/icons/trash.svg?react'
import CloseIcon from '@/assets/icons/close-x.svg?react'

const FullPageChat = () => {
  const [searchParams] = useSearchParams()
  const sessionIdFromUrl = searchParams.get('sessionId')

  // Khởi tạo hook với ID lấy từ URL
  const { messages, isLoading, sendMessage, clearChat } = useChat(sessionIdFromUrl)

  const handleClear = () => {
    if (window.confirm('Delete history?')) {
      clearChat()
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
      <div className="h-full w-full bg-white">
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          headerAction={
            <button
              onClick={() => window.close()}
              className="flex cursor-pointer items-center rounded-full p-2 font-medium transition group-hover:text-[#F23030] hover:bg-gray-100 hover:text-[#F23030]"
            >
              <CloseIcon height={20} width={20} className="inline-block group-hover:text-[#F23030]" />
            </button>
          }
          headerAdditionalActions={
            <button
              onClick={handleClear}
              className="flex cursor-pointer items-center rounded-md px-3 py-1 font-medium text-[#F23030] transition hover:bg-gray-100"
            >
              <TrashIcon className="mr-2 inline-block h-4 w-4" />
              Delete Chat
            </button>
          }
        />
      </div>
    </div>
  )
}

export default FullPageChat
