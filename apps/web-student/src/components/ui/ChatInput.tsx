import { useRef } from 'react'
import SendIcon from '@/assets/icons/send.svg'
import { FormEvent, useState, KeyboardEvent } from 'react'

const PLACEHOLDER_TEXT = 'Type your message'
interface ChatInputProps {
  onSend: (msg: string) => void
  isLoading: boolean
}

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    onSend(input)
    setInput('')

    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="chat__footer flex items-center justify-center rounded-b-4xl pb-5">
      <form onSubmit={handleSubmit} className="chat__footer-form relative flex w-full items-center px-6">
        <textarea
          rows={1}
          required
          value={input}
          ref={textareaRef}
          onKeyDown={handleKeyDown}
          onChange={e => setInput(e.target.value)}
          placeholder={PLACEHOLDER_TEXT}
          autoFocus
          className="Chat__footer-input field-sizing-content h-fit max-h-42 min-h-14 w-full resize-none rounded-[28px] text-[14px] leading-6"
        />

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="chat__submit absolute right-8 bottom-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#003087] disabled:opacity-60"
        >
          <img src={SendIcon} alt="Send Icon" height={16} width={16} className="shrink-0" />
        </button>
      </form>
    </div>
  )
}

export default ChatInput
