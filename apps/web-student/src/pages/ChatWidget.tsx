import { useState, useMemo } from 'react'
import { useChat } from '@/hooks/useChat'
import { ChatContainer } from '@/components/Chatbot/ChatContainer'
import { useDraggable } from '@/hooks/useDraggable'
import ConfirmModal from '@/components/ui/ConfirmModal'

import ExpandIcon from '@/assets/icons/arrow-expand-alt.svg?react'
import LogoGreenwich from '@/assets/icons/LogoGreenwich.svg'
import TrashIcon from '@/assets/icons/trash.svg?react'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { sessionId, messages, isLoading, sendMessage, clearChat } = useChat()
  const [showConfirm, setShowConfirm] = useState(false)

  const { position, isDragging, dragHandlers } = useDraggable()

  const placement = useMemo(() => {
    const { x, y } = position
    const isRightSide = x > window.innerWidth / 2
    const isTopSide = y < window.innerHeight / 2
    return { isRightSide, isTopSide }
  }, [position])

  const handleFAQClick = (question: string) => {
    sendMessage(question)
  }

  const handleExpand = () => {
    if (sessionId) {
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

  const toggleOpen = () => {
    if (!isDragging) {
      setIsOpen(prev => !prev)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        touchAction: 'none'
      }}
      className="flex items-center justify-center"
    >
      <div
        className={`chat absolute flex flex-col overflow-hidden rounded-4xl bg-white shadow-2xl shadow-slate-400 transition-all duration-300 ease-in-out ${
          isOpen ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-0 opacity-0'
        } ${
          // 1. XỬ LÝ VỊ TRÍ VÀ KHOẢNG CÁCH NGANG (Horizontal)
          placement.isRightSide ? 'right-full' : 'left-full'
        } ${
          // 2. XỬ LÝ VỊ TRÍ DỌC (Vertical) - Dùng top-0/bottom-0 để căn theo nút
          placement.isTopSide ? 'top-12' : 'bottom-12'
        } ${
          // 3. XỬ LÝ ORIGIN (Điểm neo Animation) - PHẦN BẠN CẦN
          // Logic: Kiểm tra Trên/Dưới trước -> Sau đó kiểm tra Trái/Phải
          placement.isTopSide
            ? placement.isRightSide
              ? 'origin-top-right'
              : 'origin-top-left' // Khi nút ở TRÊN
            : placement.isRightSide
              ? 'origin-bottom-right'
              : 'origin-bottom-left' // Khi nút ở DƯỚI
        } `}
        style={{ width: '480px', height: '640px', maxHeight: '80vh', maxWidth: '80vw' }}
      >
        <ConfirmModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleConfirmDelete} />

          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            onSend={sendMessage}
            sessionId={sessionId}
            onQuestionClick={handleFAQClick}
            headerAction={
              <button
                onClick={handleExpand}
              className="flex cursor-pointer items-center rounded-lg p-1 font-medium text-[#003087] duration-150 hover:bg-[#e2e2fc] hover:text-[#0047ca]"
              >
                <ExpandIcon className="h-6 w-6" />
              </button>
            }
            headerAdditionalActions={
              <button
                onClick={handleClearClick}
              className="flex cursor-pointer items-center rounded-md p-1 font-medium text-[#d31e1e] duration-150 hover:bg-[#fce2e2] hover:text-[#d30f0f]"
              >
                <TrashIcon className="h-6 w-6" />
              </button>
            }
          />
      </div>

      <div
        {...dragHandlers}
        onClick={toggleOpen}
        className={`open-button flex h-16 w-16 cursor-grab items-center justify-center rounded-full bg-[#00033d] shadow-lg transition-transform duration-200 active:cursor-grabbing ${isOpen ? 'scale-90 hover:scale-95' : 'scale-100 hover:scale-105'} `}
        style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
      >
        <img
          src={LogoGreenwich}
          alt="Greenwich Logo"
          className="pointer-events-none h-14 w-14 rounded-full object-cover"
        />
      </div>
    </div>
  )
}

export default ChatWidget
