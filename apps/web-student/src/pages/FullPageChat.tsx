import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useChat } from '@/hooks/useChat'
import { ChatContainer } from '@/components/Chatbot/ChatContainer'
import ConfirmModal from '@/components/ui/ConfirmModal'

import TrashIcon from '@/assets/icons/trash.svg?react'
import CloseIcon from '@/assets/icons/close-x.svg?react'

const FullPageChat = () => {
  const [searchParams] = useSearchParams()
  const sessionIdFromUrl = searchParams.get('sessionId')

  // Khởi tạo hook với ID lấy từ URL
  const { messages, isLoading, sendMessage, clearChat } = useChat(sessionIdFromUrl)

  const [showConfirm, setShowConfirm] = useState(false)

  const handleFAQClick = (question: string) => {
    sendMessage(question)
  }

  const handleClearClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmDelete = () => {
    clearChat()
    setShowConfirm(false)
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-white overflow-hidden">
      <ConfirmModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleConfirmDelete} />

      <div className="h-full w-full bg-white">
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          onQuestionClick={handleFAQClick}
          headerAction={
            <button
              onClick={() => window.close()}
              className="flex cursor-pointer items-center rounded-full p-2 font-medium transition group-hover:text-[#F23030] hover:bg-gray-100 hover:text-[#F23030]"
            >
              <CloseIcon className="h-5 w-5 group-hover:text-[#F23030]" />
            </button>
          }
          headerAdditionalActions={
            <button
              onClick={handleClearClick}
              className={`flex cursor-pointer items-center gap-2 rounded-lg p-2 font-medium text-[#b31616] duration-150 hover:bg-[#fff0f0] hover:text-[#d30f0f]`}
            >
              <p className={`font-medium`}>Clear Chat</p>
              <TrashIcon className="h-5 w-5" />
            </button>
          }
        />
      </div>
    </div>
  )
}

export default FullPageChat
