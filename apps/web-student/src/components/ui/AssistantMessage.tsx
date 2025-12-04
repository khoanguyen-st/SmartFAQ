import { useState } from 'react'
import { ChatHistoryMessage, submitChatFeedback, FEEDBACK_TYPES, type FeedbackType } from '@/services/chat.services'
import { useI18n } from '@/lib/i18n'

import CopyIcon from '@/assets/icons/copy-outline.svg?react'
import CopiedIcon from '@/assets/icons/copy-fill.svg?react'
import LikeIcon from '@/assets/icons/like-outline.svg?react'
import LikeIconFill from '@/assets/icons/like-fill.svg?react'

interface AssistantMessageProps {
  message: ChatHistoryMessage
  sessionId: string | null
}

const AssistantMessage = ({ message, sessionId }: AssistantMessageProps) => {
  const { t } = useI18n()
  const [isCopied, setIsCopied] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackType | null>(null)

  // 1. Logic Copy
  const handleCopy = () => {
    if (!message.text) return
    navigator.clipboard.writeText(message.text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 1000)
  }

  // 2. Logic Feedback
  const handleFeedback = async (clickedType: typeof FEEDBACK_TYPES.UP | typeof FEEDBACK_TYPES.DOWN) => {
    if (!sessionId || !message.chatId) return

    const isTogglingOff = feedbackStatus === clickedType

    const newUiStatus = isTogglingOff ? null : clickedType

    // Use the Constant for RESET
    const apiPayloadValue = isTogglingOff ? FEEDBACK_TYPES.RESET : clickedType

    setFeedbackStatus(newUiStatus)

    try {
      await submitChatFeedback({
        chatId: message.chatId,
        sessionId: sessionId,
        feedback: apiPayloadValue
      })
    } catch (error) {
      console.error('Feedback error', error)
    }
  }

  return (
    <div className="message message--sender">
      <p className="whitespace-pre-wrap">{message.text}</p>

      {/* Action Bar*/}
      <div className="mt-2 flex items-center gap-2 border-t border-[#E5E7EB] pt-2 pl-1">
        <button onClick={handleCopy} className="cursor-pointer transition" title={isCopied ? t('copied') : t('copy')}>
          {isCopied ? (
            <CopiedIcon className="h-4 w-4 text-[#6b7280]" />
          ) : (
            <CopyIcon className="h-4 w-4 text-[#6b7280]" />
          )}
        </button>

        <button
          onClick={() => handleFeedback(FEEDBACK_TYPES.UP)}
          className={`mx-2 cursor-pointer transition`}
          title={t('helpful')}
        >
          {feedbackStatus === FEEDBACK_TYPES.UP ? (
            <LikeIconFill className="h-3.5 w-3.5 text-[#6b7280] hover:text-[#008b3c]" />
          ) : (
            <LikeIcon className="h-3.5 w-3.5 text-[#6b7280] hover:text-[#008b3c]" />
          )}
        </button>

        <button
          onClick={() => handleFeedback(FEEDBACK_TYPES.DOWN)}
          className={`cursor-pointer transition`}
          title={t('notHelpful')}
        >
          {feedbackStatus === FEEDBACK_TYPES.DOWN ? (
            <LikeIconFill className="h-3.5 w-3.5 rotate-180 text-[#6b7280] hover:text-[#9e1d1d]" />
          ) : (
            <LikeIcon className="h-3.5 w-3.5 rotate-180 text-[#6b7280] hover:text-[#9e1d1d]" />
          )}
        </button>
      </div>
    </div>
  )
}

export default AssistantMessage
