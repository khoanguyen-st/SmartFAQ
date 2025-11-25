import { useState, FormEvent, useRef, useEffect } from 'react'
import LogoGreenwich from '@/assets/icons/LogoGreenwich.svg?react'
import SendIcon from '@/assets/icons/send.svg?react'
import Expandicon from '@/assets/icons/arrow-expand-alt.svg?react'

import { useChat } from '@/hooks/useChat'
import { useExpandChat } from '@/hooks/useExpandChat'
import { cn } from '@/lib/utils'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  
  const { history, sendMessage, isLoading } = useChat()
  const { expandToFullPage } = useExpandChat()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [history, isOpen])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    await sendMessage(inputValue.trim())
    setInputValue('')
  }

  return (
    <div className="fixed right-10 bottom-10 z-50">
      <div
        className={`chat m-12 flex h-130 w-96 flex-col rounded-2xl bg-white shadow-2xl transition-all duration-200 ease-in-out ${
          isOpen ? 'origin-bottom-right scale-100 opacity-100' : 'pointer-events-none m-0 origin-bottom-right scale-0 opacity-0'
        } `}
      >
        <div className="chat__header flex items-center justify-between rounded-t-2xl bg-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <LogoGreenwich className="h-10 w-10 shrink-0 rounded-full bg-[#00033d] p-1 text-white" />
            <div className="chat__title flex flex-col">
              <h1 className="text-lg font-bold text-[#111827]">Greenwich FAQ</h1>
              <p className="text-xs text-[#6B7280]">Smart Assistant</p>
            </div>
          </div>
          
          <button 
            className="expand-button rounded-full p-1 hover:bg-gray-100 transition-colors" 
            onClick={() => expandToFullPage(history)}
            title="Expand to full screen"
          >
            <Expandicon className="h-6 w-6 shrink-0 cursor-pointer text-gray-500" />
          </button>
        </div>

        <div className="chat__content flex flex-1 flex-col gap-3 overflow-y-auto p-4 bg-gray-50">
          {history.length === 0 && (
             <p className="text-center text-sm text-gray-400 mt-10">Start a conversation...</p>
          )}

          {history.map((msg) => (
            <div 
                key={msg.id} 
                className={cn(
                    "message max-w-[85%] p-3 text-sm shadow-sm wrap-break-word",
                    msg.author === 'user' ? "message--receiver" : "message--sender"
                )}
            >
              <p>{msg.content}</p>
            </div>
          ))}
          
          {isLoading && (
             <div className="message message--sender">
                <p className="italic text-gray-500">Typing...</p>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat__footer relative p-4 bg-white rounded-b-2xl">
          <form onSubmit={handleSend} className="relative flex w-full items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="Chat__footer-input h-12 w-full rounded-full border border-gray-200 pl-4 pr-12 text-sm outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="chat__submit absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#003087] text-white transition-transform hover:scale-105 disabled:opacity-50"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <button
        className={`open-button flex h-16 w-16 items-center justify-center rounded-full bg-[#00033d] shadow-lg transition-all duration-200 hover:scale-105 ${
          isOpen ? 'rotate-90 opacity-0 pointer-events-none' : 'rotate-0 opacity-100'
        }`}
        onClick={() => setIsOpen(true)}
      >
        <LogoGreenwich className="h-10 w-10 text-white" />
      </button>

      <button
         className={`open-button flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 shadow-lg transition-all duration-200 ${
            isOpen ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0 pointer-events-none absolute'
         }`}
         onClick={() => setIsOpen(false)}
      >
         <span className="text-2xl font-bold text-gray-600">×</span>
      </button>
    </div>
  )
}

export default ChatWidget