import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import LogoGreenwich from '@/assets/icons/LogoGreenwich.svg?react'
import SendIcon from '@/assets/icons/send.svg?react'
import ExpandIcon from '@/assets/icons/arrow-expand-alt.svg?react'
import { startNewChatSession, sendChatMessage, ChatHistoryMessage } from '@/services/chat.services'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([])
  const [input, setInput] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // --- Feature: Transfer Session ID to ViewChat Page ---
  const handleExpandToPage = () => {
    if (sessionId) {
      // Lưu sessionId hiện tại vào localStorage để ViewChat.tsx có thể đọc được
      localStorage.setItem('chatSessionId', sessionId)
      // Xóa cache tin nhắn cũ (nếu có) để ViewChat buộc phải gọi API getChatHistory
      localStorage.removeItem('chatMessages')
    }
    navigate('/chat')
  }

  // --- Feature: New Session on Reload (Mount) ---
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true)
        // Luôn tạo session mới, không đọc từ localStorage
        const res = await startNewChatSession()
        setSessionId(res.sessionId)

        setMessages([
          {
            role: 'system',
            text: "Hi! I'm Smart FAQ.",
            timestamp: new Date().toISOString()
          }
        ])
      } catch (error) {
        console.error('Failed to start session:', error)
        setMessages([
          {
            role: 'assistant',
            text: 'Failed to connect to chat service. Please refresh the page.',
            timestamp: new Date().toISOString()
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, []) // Chạy 1 lần khi mount -> tạo session mới

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  // --- Feature: Send Message (No Sources) ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!input.trim() || !sessionId || isLoading) return

    const userText = input.trim()
    setInput('') // Clear input

    // 1. Optimistic Update: Hiển thị tin nhắn user ngay lập tức
    const newUserMsg: ChatHistoryMessage = {
      role: 'user',
      text: userText,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMsg])
    setIsLoading(true)

    try {
      // 2. Call API
      const res = await sendChatMessage(sessionId, userText)

      // 3. Update Bot Response
      // Chỉ lấy 'answer', bỏ qua 'sources' như yêu cầu
      const newBotMsg: ChatHistoryMessage = {
        role: 'assistant',
        text: res.answer,
        timestamp: new Date().toISOString(),
        chatId: res.chatId
      }
      setMessages(prev => [...prev, newBotMsg])
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I encountered an error trying to get a response.',
          timestamp: new Date().toISOString()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed right-10 bottom-10 z-50">
      <div
        className={`chat m-10 flex h-fit w-120 flex-col rounded-3xl bg-white shadow-lg shadow-slate-400 transition-all duration-150 ease-in-out ${
          isOpen ? 'translate-y-0 scale-100' : 'pointer-events-none translate-y-4 scale-0'
        } `}
        style={{ transformOrigin: 'bottom right' }}
      >
        <div className="chat__header flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <LogoGreenwich className="mr-3 h-10 w-10 shrink-0 rounded-full bg-[#00033d] p-1 text-white" />
            <div className="chat__title -mt-1 flex flex-col">
              <h1 className="text-xl leading-7 font-semibold text-[#111827]">Greenwich Smart FAQ</h1>
              <p className="text-sm leading-5 font-normal text-[#6B7280]">Document-based chatbot training system</p>
            </div>
          </div>
          <button className="expand-button" onClick={handleExpandToPage} title="Expand to full page">
            <ExpandIcon className="mr-2 h-5 w-5 shrink-0 cursor-pointer transition-colors hover:text-blue-600" />
          </button>
        </div>
        <div className="chat__content relative flex h-120 flex-col overflow-y-auto border-t border-b border-[#E5E7EB]">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user'
            return (
              <div key={index} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`message ${isUser ? 'message--receiver' : 'message--sender'}`}>
                  <p className="wrap-words whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="mb-4 flex w-full justify-start px-4 pt-4">
              <div className="rounded-2xl rounded-tl-none border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
        <div className="chat__footer flex h-20 items-center justify-center">
          <form onSubmit={handleSendMessage} className="flex w-full items-center rounded-b-3xl bg-white px-6 py-2">
            <textarea
              rows={1}
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="Chat__footer-input mr-4 h-10 w-full resize-none rounded-lg border border-gray-300 px-2 py-1 text-[14px] leading-7 focus:border-blue-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading || !sessionId}
              className="chat__submit flex h-10 w-14 cursor-pointer items-center justify-center rounded-lg bg-[#003087] text-white hover:bg-[#00205a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendIcon className="h-4 w-4 shrink-0" />
            </button>
          </form>
        </div>
      </div>
      <button
        className={`open-button flex h-15 w-15 cursor-pointer items-center justify-center rounded-[50%] bg-[#00033d] shadow-lg transition-all duration-150 ease-in-out ${
          isOpen ? 'scale-95' : 'scale-100'
        } `}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <LogoGreenwich className="h-11 w-11 text-[#ffffff]" />
      </button>
    </div>
  )
}

export default ChatWidget
