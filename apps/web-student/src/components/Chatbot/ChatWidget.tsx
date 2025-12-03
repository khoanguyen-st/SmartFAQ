import { useState } from 'react'
import { useChat } from '@/hooks/useChat'
import { ChatContainer } from './ChatContainer'
import ConfirmModal from '../ui/ConfirmModal'

import ExpandIcon from '@/assets/icons/arrow-expand-alt.svg?react'
import LogoGreenwich from '@/assets/icons/LogoGreenwich.svg'
import TrashIcon from '@/assets/icons/trash.svg?react'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)

  const { sessionId, messages, isLoading, sendMessage, clearChat } = useChat()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleExpand = () => {
    if (sessionId) {
      // localhost:5173
      // https://your-domain.com
      const HOST_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5173'

      const url = `${HOST_URL}/chat?sessionId=${sessionId}`
      window.open(url, '_blank')
    }
  }

  const handleClearClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmDelete = () => {
    clearChat()
    setShowConfirm(false)
  }

  return (
    <div className="fixed right-10 bottom-10 z-[999]">
      <ConfirmModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleConfirmDelete} />
      <div
        className={`chat flex flex-col overflow-hidden rounded-4xl bg-white shadow-2xl shadow-slate-400 ${
          isOpen
            ? 'm-9 h-160 w-120 translate-y-0 opacity-100 transition-all duration-300 ease-in-out'
            : 'h-0 w-0 opacity-0 transition-all duration-300 ease-in-out'
        } origin-bottom-right`}
      >
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          sessionId={sessionId}
          headerAction={
            <button
              onClick={handleExpand}
              className={`flex cursor-pointer items-center rounded-lg p-1 font-medium text-[#003087] duration-150 hover:bg-[#e2e2fc] hover:text-[#0047ca]`}
            >
              <ExpandIcon className="h-6 w-6" />
            </button>
          }
          headerAdditionalActions={
            <button
              onClick={handleClearClick}
              className={`flex cursor-pointer items-center rounded-md p-1 font-medium text-[#d31e1e] duration-150 hover:bg-[#fce2e2] hover:text-[#d30f0f]`}
            >
              <TrashIcon className="h-6 w-6" />
            </button>
          }
        />
      </div>

      <button
        className={`open-button flex h-18 w-18 origin-bottom-right cursor-pointer items-center justify-center rounded-[50%] bg-[#00033d] transition-all duration-200 ease-in-out ${
          isOpen
            ? 'flex translate-x-4 translate-y-2 scale-80 hover:scale-82'
            : 'flex h-18 w-18 origin-bottom-right scale-100 hover:scale-95'
        } `}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <img src={LogoGreenwich} alt="Greenwich Logo" width={60} height={60} className="rounded-full" />
      </button>
    </div>
  )
}

export default ChatWidget
