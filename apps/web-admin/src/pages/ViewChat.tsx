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
import UploadedFile from '@/components/viewchat/UploadedFile'
import { useKnowledgeFiles } from '@/hooks/useKnowledgeFiles'
import Upload from '@/components/viewchat/Upload'

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
  const { files, loading, error, uploadError, handleFileUpload, handleDeleteFile } = useKnowledgeFiles()

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
      <div className="flex h-full w-1/2 flex-col">
        <div className="detail__header flex flex-col  justify-center p-6">
          <div className="title-header flex">
            <KnowledgeIcon className="mr-2 h-6 w-6 shrink-0" />
            <h1 className="text-[18px] leading-7 font-semibold">Knowledge Sources</h1>
          </div>
          <p className="text-sm text-gray-500">Upload and manage documents for chatbot training</p>
        </div>

        <Upload onFilesUpload={handleFileUpload} error={uploadError} />

        <UploadedFile files={files} onDeleteFile={handleDeleteFile} isLoading={loading} loadError={error} />
      </div>
      <div className="chat flex h-full w-1/2 flex-col">
        <div className="chat__header flex items-center justify-between p-6">
          <div className="chat__title flex w-[300px] flex-col overflow-hidden text-nowrap text-ellipsis">
            <div className="title-header flex">
              <MessIcon className="mr-2 h-6 w-6 shrink-0" />
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

        <div ref={chatContentRef} className="chat__content relative flex h-full flex-col overflow-y-auto">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {/* Show typing indicator */}
          {isLoading && (
            <div className="message message--sender">
              <p className="animate-pulse">Typing...</p>
            </div>
          )}
          {/* Show general error */}
          {error && !messages.some(m => m.type === 'error') && (
            <div className="message message--sender bg-red-100 py-3 text-red-700">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Commented out static content */}
        {/* <div className="chat__content ..."> ... </div> */}

        <div className="chat__footer flex h-24 flex-col px-6 py-4">
          <form
            onSubmit={handleSend}
            action=""
            method="post"
            className="chat__form flex items-center justify-between"
            autoComplete="off"
          >
            <input
              type="text"
              name="user-input"
              id="user-input"
              value={userText}
              onChange={e => setUserText(e.target.value)}
              placeholder={!sessionId ? 'Connecting to chat...' : 'Ask a question about your uploaded documents...'}
              disabled={!sessionId}
              className="chat__input mr-3 h-[40px] w-full rounded-[8px] border border-[#D1D5DB] p-4 placeholder:text-[14px] placeholder:leading-[20px] disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!sessionId || isLoading || userText.trim().length === 0}
              className="chat__submit flex h-[40px] w-[48px] items-center justify-center rounded-[8px] bg-[#003087] hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendIcon className="h-4 w-4 shrink-0" />
            </button>
          </form>
          <div className="chat__note mt-3 flex h-4 items-center">
            <InforIcon className="mr-1 h-3 w-3 shrink-0" />
            <p className="py-2.5 text-[12px] font-normal text-[#6B7280]">
              Responses are generated based on uploaded documents only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewChatPage
