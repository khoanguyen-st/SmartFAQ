import { useState } from 'react'
import { ChatHistoryMessage, submitChatFeedback } from '@/services/chat.services'

import CopyIcon from '@/assets/icons/copy-outline.svg?react'
import CopiedIcon from '@/assets/icons/copy-fill.svg?react'
import LikeIcon from '@/assets/icons/like-outline.svg?react'
import LikeIconFill from '@/assets/icons/like-fill.svg?react'

interface AssistantMessageProps {
  message: ChatHistoryMessage
  sessionId: string | null
}

const AssistantMessage = ({ message, sessionId }: AssistantMessageProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState<'up' | 'down' | null>(null)

  // 1. Logic Copy
  const handleCopy = () => {
    if (!message.text) return
    navigator.clipboard.writeText(message.text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 1000)
  }

  // 2. Logic Feedback
  const handleFeedback = async (clickedType: 'up' | 'down') => {
    if (!sessionId || !message.chatId) return
    const isTogglingOff = feedbackStatus === clickedType // Người dùng bấm lại nút đang sáng

    const newUiStatus = isTogglingOff ? null : clickedType // Nếu toggle off thì UI về null, ngược lại thì theo nút bấm
    const apiPayloadValue = isTogglingOff ? 'reset' : clickedType // Nếu toggle off thì gửi 'reset', ngược lại gửi 'up'/'down'

    setFeedbackStatus(newUiStatus)

    try {
      await submitChatFeedback({
        chatId: message.chatId,
        sessionId: sessionId,
        feedback: apiPayloadValue // Gửi 'up', 'down' hoặc 'reset'
      })
      console.log(`Feedback updated to: ${apiPayloadValue}`)
    } catch (error) {
      console.error('Feedback error', error)
      // Rollback lại trạng thái cũ nếu lỗi (Optional)
      // setFeedbackStatus(feedbackStatus);
    }
  }

  return (
    <div className="mb-4 flex w-full items-start gap-3">
      <div className="message message--sender">
        <p className="whitespace-pre-wrap">{message.text}</p>

        {/* Action Bar*/}

        <div className="mt-2 flex items-center gap-2 border-t border-[#E5E7EB] pt-2 pl-1">
          <button onClick={handleCopy} className="cursor-pointer transition">
            {isCopied ? (
              <CopiedIcon className="h-4 w-4 text-[#6b7280]" />
            ) : (
              <CopyIcon className="h-4 w-4 text-[#6b7280]" />
            )}
          </button>

          {/* Nút Thumb Up */}
          <button onClick={() => handleFeedback('up')} className={`mx-2 cursor-pointer transition`} title="Helpful">
            {feedbackStatus === 'up' ? (
              <LikeIconFill className="h-3.5 w-3.5 text-[#6b7280] hover:text-[#008b3c]" />
            ) : (
              <LikeIcon className="h-3.5 w-3.5 text-[#6b7280] hover:text-[#008b3c]" />
            )}
          </button>

          {/* Nút Thumb Down */}
          <button onClick={() => handleFeedback('down')} className={`cursor-pointer transition`}>
            {feedbackStatus === 'down' ? (
              <LikeIconFill className="h-3.5 w-3.5 rotate-180 text-[#6b7280] hover:text-[#9e1d1d]" />
            ) : (
              <LikeIcon className="h-3.5 w-3.5 rotate-180 text-[#6b7280] hover:text-[#9e1d1d]" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssistantMessage
