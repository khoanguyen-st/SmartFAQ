import SendIcon from '@/assets/icons/send.svg'
import { FormEvent, useState, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (msg: string) => void
  isLoading: boolean
}

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return
    onSend(input)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="chat__footer relative flex items-center justify-center rounded-b-4xl pb-5">
      <form action="" className="chat__footer-form relative flex w-full items-center bg-transparent px-8">
        <textarea
          rows={1}
          required
          disabled={isLoading}
          value={input}
          onKeyDown={handleKeyDown}
          onChange={e => setInput(e.target.value)}
          id="Chat__footer-input"
          className="Chat__footer-input h-10 w-full resize-none rounded-full text-[14px] leading-4"
        />
        <label
          className="absolute top-1/2 left-14 z-9 -translate-y-1/2 cursor-text text-[#1f2937]"
          htmlFor="Chat__footer-input"
        >
          Type your message
        </label>

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="chat__submit absolute top-1/2 right-9 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#003087] disabled:opacity-60"
        >
          <img src={SendIcon} alt="Send Icon" height={15} width={15} className="shrink-0" />
        </button>
      </form>
    </div>
  )
}

export default ChatInput
