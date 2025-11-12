import { useState, useEffect, useRef } from 'react'
import {
  startNewChatSession,
  sendChatMessage,
  ChatSource,
  getChatHistory,
  ChatHistoryMessage
} from '@/services/chat.services'

import MessIcon from '@/assets/messager.svg?react'
import SendIcon from '@/assets/send.svg?react'
import InforIcon from '@/assets/i-icon.svg?react'
import TrashIcon from '@/assets/trash-icon.svg?react'
import PdfNoFill from '@/assets/pdf-no-fill.svg?react'
import ImageNofill from '@/assets/image-no-fill.svg?react'
import TxtNoFill from '@/assets/txt-no-fill.svg?react'
import KnowledgeIcon from '@/assets/knowledge.svg?react'
import UploadModal from '@/components/dashboard/UploadModal'
import PlusIcon from '@/assets/plus.svg?react'
import SidebarIcon from '@/assets/sidebar.svg?react'
import UploadedFile from '@/components/viewchat/UploadedFile'
import { useKnowledgeFiles } from '@/hooks/useKnowledgeFiles'
import { cn } from '@/lib/utils'


type DisplayMessage = {
  id: string | number
  type: 'system' | 'sender' | 'receiver' | 'error'
  content: string[]
  sources?: ChatSource[]
  chatId?: string
}

const initialMessage: DisplayMessage = {
  id: Date.now(),
  type: 'system',
  content: ['Welcome to Smart FAQ.']
}

// --- Helper function to format API history ---
function formatHistoryMessage(msg: ChatHistoryMessage): DisplayMessage {
  return {
    id: msg.chatId || msg.timestamp,
    type: msg.role === 'user' ? 'receiver' : 'sender',
    content: msg.text.split('\n'),
    chatId: msg.chatId || undefined,
    // Note: Your /history endpoint doesn't return sources for old messages.
    // Sources will only appear for new messages in this session.
    sources: undefined
  }
}

// --- Updated ChatMessage Component ---
type ChatMessageProps = {
  message: DisplayMessage
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  if (message.type === 'system') {
    return (
      <div className="welcome-message">
        {message.content.map((line: string, i: number) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    )
  }

  if (message.type === 'error') {
    return (
      <div className="message message--sender bg-red-100 py-3 text-red-700">
        <p className="font-bold">Error:</p>
        {message.content.map((line: string, i: number) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    )
  }

  if (message.type === 'sender') {
    return (
      <div className="message message--sender">
        {message.content.map((line: string, i: number) => (
          <p key={i}>{line}</p>
        ))}
        {/* Updated Source Rendering Logic */}
        {message.sources && message.sources.length > 0 && (
          <div className="message__reference mt-2 border-t border-gray-300 pt-2">
            <h4 className="mb-1 text-xs font-semibold">Sources:</h4>
            {message.sources.map((source, index) => {
              const filename = source.title.toLowerCase()
              let IconComponent = TxtNoFill // Default
              if (filename.endsWith('.pdf')) {
                IconComponent = PdfNoFill
              } else if (filename.endsWith('.jpg') || filename.endsWith('.gif') || filename.endsWith('.png')) {
                IconComponent = ImageNofill
              }

              return (
                <div key={index} className="mt-1 flex items-center">
                  <IconComponent className="mr-2 h-3 w-3 shrink-0" />
                  <p className="truncate text-sm">
                    {source.title}
                    {/* API doesn't provide pages, but you could show relevance or chunkId */}
                    {/* {source.relevance && ` (${(source.relevance * 100).toFixed(0)}%)`} */}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (message.type === 'receiver') {
    return (
      <div className="message message--receiver">
        {message.content.map((line: string, i: number) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    )
  }
  return null
}

// --- Updated ViewChatPage Component ---
const ViewChatPage = () => {
  const { files, loading, error, uploadError, refreshFiles, handleDeleteFile } = useKnowledgeFiles()

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const [messages, setMessages] = useState<DisplayMessage[]>(() => {
    const storedMessages = localStorage.getItem('chatMessages')
    return storedMessages ? JSON.parse(storedMessages) : [initialMessage]
  })

  const [userText, setUserText] = useState('')

  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem('chatSessionId')
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errorState, setErrorState] = useState<string | null>(null)

  const chatContentRef = useRef<HTMLDivElement>(null)

  // Mở Modal thay vì click input file
  const handleSelectFileClick = () => {
    setIsUploadModalOpen(true)
  }

  // Khi đóng modal thì refresh lại danh sách file
  const handleModalClose = () => {
    setIsUploadModalOpen(false)
    refreshFiles() 
  }

  // Effect to get session ID on mount
  // --- MODIFIED EFFECT: Load session or start new one ---
  useEffect(() => {
    const initSession = async () => {
      const storedSessionId = localStorage.getItem('chatSessionId')

      if (storedSessionId) {
        // Session found, validate it and fetch history
        setSessionId(storedSessionId)
        setIsLoading(true)
        try {
          const historyResponse = await getChatHistory(storedSessionId)
          if (historyResponse.messages.length > 0) {
            setMessages(historyResponse.messages.map(formatHistoryMessage))
          } else {
            // Session was valid but empty, or history was cleared
            setMessages([initialMessage])
          }
          // setErrorState(null)
        } catch (err) {
          console.error('Failed to fetch history, starting new session.', err)
          // The stored session might be invalid/expired. Start a new one.
          await startNewSession()
        } finally {
          setIsLoading(false)
        }
      } else {
        // No session found, start a new one
        await startNewSession()
      }
    }

    const startNewSession = async () => {
      setIsLoading(true)
      try {
        // setErrorState(null)
        const sessionResponse = await startNewChatSession()
        setSessionId(sessionResponse.sessionId)
        setMessages([initialMessage])
      } catch (err) {
        console.error(err)
        // setErrorState('Failed to start chat session.')
        setMessages([
          {
            id: 'error-session',
            type: 'error',
            content: ['Failed to connect to chat service. Please refresh the page.']
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    // We only want this to run once on initial load.
    // The `sessionId` state is already initialized from localStorage.
    if (!sessionId) {
      initSession()
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('chatSessionId', sessionId)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId && messages.length > 0) {
      // Only save messages if a session is active
      localStorage.setItem('chatMessages', JSON.stringify(messages))
    }
  }, [messages, sessionId])

  // Effect to scroll to bottom on new message
  useEffect(() => {
    const el = chatContentRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  // Handle clearing chat (start a new session)
  const handleClearChat = async () => {
    setIsLoading(true)
    try {
      // setErrorState(null)
      // Clear local storage
      localStorage.removeItem('chatSessionId')
      localStorage.removeItem('chatMessages')

      // Start a new session
      const sessionResponse = await startNewChatSession()
      setSessionId(sessionResponse.sessionId)
      setMessages([initialMessage]) // Reset to welcome
    } catch (err) {
      console.error(err)
      // setErrorState('Failed to start a new chat session.')
      // ... error handling ...
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sending a message
  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmedInput = userText.trim()

    if (!trimmedInput || !sessionId || isLoading) return

    const newUserMessage: DisplayMessage = {
      id: Date.now(),
      type: 'receiver',
      content: [trimmedInput]
    }

    setMessages(prev => [...prev.filter(m => m.type !== 'system'), newUserMessage])
    setIsLoading(true)
    setUserText('')
    // setErrorState(null)

    try {
      // --- Real API Call ---
      const response = await sendChatMessage(sessionId, trimmedInput)

      // Format API response to DisplayMessage
      const aiMessage: DisplayMessage = {
        id: response.chatId,
        type: 'sender',
        content: response.answer.split('\n'), // Split answer by newlines
        sources: response.sources,
        chatId: response.chatId
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      console.error(err)
      const errorMessage: DisplayMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: ['Sorry, I encountered an error trying to get a response.']
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-100px)] w-full border border-[#e5e7eb] bg-white">
      {/* --- Left Panel (Knowledge) --- */}
      <div 
        className={cn(
          "flex h-full flex-col transition-all duration-300 ease-in-out border-r border-[#F3F4F6] bg-white z-10",
          isSidebarOpen ? "w-1/2 min-w-[400px]" : "w-[118px]" 
        )}
      >
        {/* Header Area */}
        <div className={cn(
            "flex items-center border-b border-[#F3F4F6] transition-all duration-300 shrink-0",
            isSidebarOpen 
              ? "justify-between p-6 h-[92px]" 
              : "justify-center h-[92px]"
        )}>
          
          {/* Title & Icon (Chỉ hiện khi MỞ) */}
          {isSidebarOpen && (
            <div className="flex flex-col overflow-hidden text-nowrap text-ellipsis">
              <div className="title-header flex items-center">
                <KnowledgeIcon className="mr-2 h-6 w-6 shrink-0 text-[#003087]" />
                <h1 className="text-[18px] font-semibold leading-7 text-[#111827]">Knowledge Sources</h1>
              </div>
              <p className="text-[14px] text-[#6B7280]">Upload and manage documents</p>
            </div>
          )}
          
          <div className={cn("flex items-center", isSidebarOpen && "gap-4")}>
            {/* Nút Upload (Chỉ hiện trong header khi MỞ) */}
            {isSidebarOpen && (
              <button
                onClick={handleSelectFileClick}
                className="flex items-center justify-center h-[36px] gap-2 px-4 rounded-[8px] bg-[#003087] transition-all hover:bg-[#00205a]"
                title="Upload Files"
              >
                <div className="flex items-center justify-center">
                   <PlusIcon className="h-3.5 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-white">Select Files</span>
              </button>
            )}
            
            {/* Nút Sidebar Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className={cn(
                "cursor-pointer p-1 hover:bg-gray-100 rounded group transition-colors",
                !isSidebarOpen && "p-2"
              )}
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
                <SidebarIcon className={cn("h-6 w-6 text-gray-400 transition-transform group-hover:text-[#003087]", !isSidebarOpen && "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Nút Upload Compact (Chỉ hiện khi sidebar ĐÓNG) */}
            {!isSidebarOpen && (
                <div className="w-full flex justify-center py-4 shrink-0">
                    <button
                        onClick={handleSelectFileClick}
                        className="flex items-center justify-center w-[48px] h-[36px] rounded-[8px] bg-[#003087] hover:bg-[#00205a] transition-colors shadow-sm"
                        title="Upload Files"
                    >
                        <PlusIcon className="h-3.5 w-3 text-white" />
                    </button>
                </div>
            )}

            {/* Error Notification */}
            {uploadError && isSidebarOpen && (
                <div className="px-6 pt-4 shrink-0">
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">{uploadError}</div>
                </div>
            )}

            {/* File List Content */}
            <div className={cn("flex-1 overflow-hidden", !isSidebarOpen && "w-full px-[22px]")}>
                <UploadedFile 
                    files={files} 
                    onDeleteFile={handleDeleteFile} 
                    isLoading={loading} 
                    loadError={error} 
                    isCompact={!isSidebarOpen} 
                />
            </div>
        </div>
      </div>

      {/* --- Right Panel (Chat) --- */}
      <div className="flex-1 flex flex-col h-[calc(100vh-100px)] overflow-hidden relative">
        <div className="chat__header flex items-center justify-between px-6 py-4 bg-white shrink-0">
          <div className="chat__title flex w-[300px] flex-col overflow-hidden text-nowrap text-ellipsis">
            <div className="title-header flex items-center gap-2">
              <MessIcon className="h-6 w-6 shrink-0" />
              <h1 className="text-[18px] leading-7 font-semibold">Chat with Your Knowledge Base</h1>
            </div>
            <p className="text-[14px] text-[#6B7280]">Test chatbot responses based on uploaded documents</p>
          </div>
          
          <button
            type="button"
            onClick={handleClearChat}
            disabled={isLoading}
            className="chat__clear-button group flex items-center hover:text-red-500 disabled:opacity-50"
          >
            <TrashIcon className="TrashIcon mr-1 h-[14px] w-[12px] shrink-0 text-[#6B7280] group-hover:text-red-500" />
            <p className="text-[14px] text-[#6B7280] group-hover:text-red-500">Clear Chat</p>
          </button>
        </div>

        <div ref={chatContentRef} className="chat__content relative flex-1 flex flex-col overflow-y-auto p-6 bg-white">
          {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
          {isLoading && <div className="message message--sender"><p className="animate-pulse">Typing...</p></div>}
        </div>

        <div className="chat__footer h-24 flex-col px-6 py-4 bg-white border-t border-gray-200 shrink-0">
          <form onSubmit={handleSend} className="chat__form flex items-center justify-between h-full">
            <input
              type="text"
              name="user-input"
              value={userText}
              onChange={e => setUserText(e.target.value)}
              placeholder={!sessionId ? 'Connecting...' : 'Ask a question about your uploaded documents...'}
              disabled={!sessionId}
              className="chat__input flex-1 mr-3 h-[40px] rounded-[8px] border border-[#D1D5DB] p-4 placeholder:text-[14px] disabled:bg-gray-100 focus:border-[#003087] outline-none"
            />
            <button
              type="submit"
              disabled={!sessionId || isLoading || userText.trim().length === 0}
              className="chat__submit flex h-[40px] w-[48px] items-center justify-center rounded-[8px] bg-[#003087] hover:bg-[#00205a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendIcon className="h-4 w-4 shrink-0" />
            </button>
          </form>
          <div className="chat__note mt-3 flex h-4 items-center">
            <InforIcon className="mr-1 h-3 w-3 shrink-0" />
            <p className="text-[12px] text-[#6B7280]">Responses are generated based on uploaded documents only</p>
          </div>
        </div>
      </div>

      {/* Upload Modal Component */}
      <UploadModal isOpen={isUploadModalOpen} onClose={handleModalClose} />
    </div>
  )
}

export default ViewChatPage