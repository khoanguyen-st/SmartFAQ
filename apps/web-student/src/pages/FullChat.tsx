import { useEffect, useRef, useState, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { ChatService } from '@/services/chat.service'
import { Message } from '@/hooks/useChat'
import { cn } from '@/lib/utils'

import LogoGreenwich from '@/assets/icons/LogoGreenwich.svg?react'
import DeleteIcon from '@/assets/icons/delete.svg?react'
import SendIcon from '@/assets/icons/send.svg?react'

const FullChat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [searchParams] = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) return
      try {
        const history = await ChatService.getSession(sessionId)
        if (history) {
          setMessages(history)
        }
      } catch (error) {
        console.error('Failed to load session:', error)
      }
    }
    loadSession()
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      author: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    
    setTimeout(() => {
      const botMsg: Message = {
        id: crypto.randomUUID(),
        author: 'assistant',
        content: 'This is a placeholder response while the API is under development.',
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, botMsg])
    }, 1000)
  }

  return (
    <div className="flex h-screen flex-col bg-white font-sans text-slate-900">
      <header className="flex h-auto min-h-20 shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 shadow-sm transition-all md:h-[119px] md:px-[60px]">
        <div className="flex items-center gap-3">
          <LogoGreenwich className="h-8 w-8 shrink-0 rounded-full bg-[#00033d] p-1 text-white md:h-[30px] md:w-[30px]" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-900 md:text-[30px] md:leading-[38px]">
                Greenwich Smart FAQ
            </h1>
            <p className="text-xs text-gray-500 md:pl-1 md:text-sm">
                Document-based chatbot training system
            </p>
          </div>
        </div>

        <button 
            className="group flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 md:px-3"
            onClick={() => setMessages([])}
        >
            <DeleteIcon className="h-5 w-5 fill-current transition-colors" />
            <span className="hidden text-sm font-medium sm:inline-block">Clear Chat</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto bg-white px-4 py-6 md:px-[60px] md:py-8">
        <div className="w-full space-y-6 md:space-y-8">
          
          <div className="flex w-full justify-start">
            <div className="relative max-w-[90%] rounded-2xl rounded-tl-none bg-[#F3F4F6] text-[#1F2937] shadow-sm md:max-w-[85%]">
              <div className="px-5 py-3 text-[15px] leading-relaxed md:px-6 md:py-4">
                <p>Hello! I'm UniBot. I'm here to help you with information about student affairs and admissions. How can I help you today?</p>
              </div>
              <div className="mx-4 mb-2 mt-1 flex gap-4 border-t border-gray-300 pt-2 text-black">
                <button className="hover:text-black"><Copy className="h-4 w-4" /></button>
                <button className="hover:text-black"><ThumbsUp className="h-4 w-4" /></button>
                <button className="hover:text-black"><ThumbsDown className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full",
                msg.author === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "relative max-w-[90%] shadow-sm text-[15px] leading-relaxed md:max-w-[85%]",
                  msg.author === 'user' 
                    ? "bg-[#003087] text-white rounded-2xl rounded-tr-none px-5 py-3 md:px-6 md:py-4" 
                    : "bg-[#F3F4F6] text-[#1F2937] rounded-2xl rounded-tl-none"
                )}
              >
                <div className={cn(msg.author === 'assistant' ? "px-5 pt-3 pb-2 md:px-6 md:pt-4" : "")}>
                  <div className="whitespace-pre-wrap wrap-break-word">{msg.content}</div>
                </div>

                {msg.author === 'assistant' && (
                  <div className="mx-4 mb-2 mt-1 flex gap-4 border-t border-gray-300 pt-2 text-black">
                    <button className="transition-colors hover:text-black"><Copy className="h-4 w-4" /></button>
                    <button className="transition-colors hover:text-black"><ThumbsUp className="h-4 w-4" /></button>
                    <button className="transition-colors hover:text-black"><ThumbsDown className="h-4 w-4" /></button> 
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="sticky bottom-0 z-10 bg-white/90 px-4 pb-6 pt-3 backdrop-blur-md transition-all md:px-[60px] md:pb-10 md:pt-4">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent opacity-50" />
        
        <div className="w-full">
          <form 
            onSubmit={handleSend}
            className={cn(
                "relative flex items-center rounded-full border bg-white pr-2 pl-4 py-2 transition-all duration-300 md:pr-3 md:pl-6 md:py-3",
                "focus-within:border-[#1677FF] focus-within:shadow-[0px_0px_12px_rgba(22,119,255,0.3)]",
                input.length > 0 
                    ? "border-[#1677FF] shadow-[0px_0px_4px_rgba(22,119,255,0.3)]" 
                    : "border-gray-300 shadow-sm hover:border-gray-400"
            )}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent py-1 text-[15px] text-slate-700 outline-none placeholder:text-[#A6A6A6]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={cn(
                  "ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 md:h-10 md:w-10",
                  input.trim() 
                    ? "bg-[#003087] text-white hover:scale-105 hover:shadow-md" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <SendIcon className="h-4 w-4 fill-current" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  )
}

export default FullChat