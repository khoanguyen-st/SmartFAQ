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
      <form action="" className="chat__footer-form relative flex w-full items-center bg-transparent px-6 ">
        <textarea
          rows={1}
          required
          disabled={isLoading}
          value={input}
          onKeyDown={handleKeyDown}
          onChange={e => setInput(e.target.value)}
          placeholder='Type your message'
          className="Chat__footer-input h-fit w-full resize-none rounded-[28px] text-[14px] leading-6 field-sizing-content min-h-14 max-h-42"
        />
    
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="chat__submit absolute bottom-4 right-8 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#003087] disabled:opacity-60"
        >
          <img src={SendIcon} alt="Send Icon" height={16} width={16} className="shrink-0" />
        </button>
      </form>
    </div>
  )
}

export default ChatInput
