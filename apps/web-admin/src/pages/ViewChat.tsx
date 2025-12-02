import {
  ChatHistoryMessage,
  ChatSource,
  getChatHistory,
  sendChatMessage,
  startNewChatSession
} from '@/services/chat.services'
import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

import inforUrl from '@/assets/icons/i-icon.svg'
import imageNoFillUrl from '@/assets/icons/image-no-fill.svg'
import messagerUrl from '@/assets/icons/messager.svg'
import pdfNoFillUrl from '@/assets/icons/pdf-no-fill.svg'
import sendUrl from '@/assets/icons/send.svg'
import trashUrl from '@/assets/icons/trash-icon.svg'
import txtNoFillUrl from '@/assets/icons/txt-no-fill.svg'
import KnowledgeSidebar from '@/components/viewchat/KnowledgeSidebar'
import UploadModal from '@/components/viewchat/UploadModal'
import sidebarUrl from '@/assets/icons/sidebar.svg'
import { UploadedFileHandle } from '@/components/viewchat/UploadedFile'

type ImgCompProps = React.ImgHTMLAttributes<HTMLImageElement>
const InforIcon: React.FC<ImgCompProps> = props => <img src={inforUrl} alt="info" {...props} />
const ImageNofill: React.FC<ImgCompProps> = props => <img src={imageNoFillUrl} alt="image" {...props} />
const MessIcon: React.FC<ImgCompProps> = props => <img src={messagerUrl} alt="message" {...props} />
const PdfNoFill: React.FC<ImgCompProps> = props => <img src={pdfNoFillUrl} alt="pdf" {...props} />
const SendIcon: React.FC<ImgCompProps> = props => <img src={sendUrl} alt="send" {...props} />
const TrashIcon: React.FC<ImgCompProps> = props => <img src={trashUrl} alt="trash" {...props} />
const TxtNoFill: React.FC<ImgCompProps> = props => <img src={txtNoFillUrl} alt="txt" {...props} />
const SidebarUrl: React.FC<ImgCompProps> = props => <img src={sidebarUrl} alt="sidebar" {...props} />

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

function formatHistoryMessage(msg: ChatHistoryMessage): DisplayMessage {
  return {
    id: msg.chatId || msg.timestamp,
    type: msg.role === 'user' ? 'receiver' : 'sender',
    content: msg.text.split('\n'),
    chatId: msg.chatId || undefined,
    sources: undefined
  }
}

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
      <div className="welcome-message w-70">
        <p className="text-xl font-bold text-red-700">Error:</p>
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
        {message.sources && message.sources.length > 0 && (
          <div className="message__reference mt-2 border-t border-gray-300 pt-2">
            <h4 className="mb-1 text-xs font-semibold">Sources:</h4>
            {message.sources.map((source, index) => {
              const filename = source.title.toLowerCase()
              let IconComponent = TxtNoFill
              if (filename.endsWith('.pdf')) {
                IconComponent = PdfNoFill
              } else if (filename.endsWith('.jpg') || filename.endsWith('.gif') || filename.endsWith('.png')) {
                IconComponent = ImageNofill
              }

              return (
                <div key={index} className="mt-1 flex items-center">
                  <IconComponent className="mr-2 h-3 w-3 shrink-0" />
                  <p className="truncate text-sm">{source.title}</p>
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

const ViewChatPage = () => {
  const uploadedFileRef = useRef<UploadedFileHandle>(null)

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const handleSelectFileClick = () => {
    setIsUploadModalOpen(true)
  }

  const handleModalClose = () => {
    setIsUploadModalOpen(false)

    if (uploadedFileRef.current) {
      uploadedFileRef.current.refreshFiles()
    }
  }

  const handleFilesUploaded = (files: { name: string; size: number; type: string }[]) => {
    if (uploadedFileRef.current) {
      uploadedFileRef.current.addPendingFiles(files)
    }
  }

  const [messages, setMessages] = useState<DisplayMessage[]>(() => {
    const storedMessages = localStorage.getItem('chatMessages')
    return storedMessages ? JSON.parse(storedMessages) : [initialMessage]
  })

  const [userText, setUserText] = useState('')

  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem('chatSessionId')
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errorState] = useState<string | null>(null)

  const chatContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initSession = async () => {
      const storedSessionId = localStorage.getItem('chatSessionId')

      if (storedSessionId) {
        setSessionId(storedSessionId)
        setIsLoading(true)
        try {
          const historyResponse = await getChatHistory(storedSessionId)
          if (historyResponse.messages.length > 0) {
            setMessages(historyResponse.messages.map(formatHistoryMessage))
          } else {
            setMessages([initialMessage])
          }
        } catch (err) {
          console.error('Failed to fetch history, starting new session.', err)
          await startNewSession()
        } finally {
          setIsLoading(false)
        }
      } else {
        await startNewSession()
      }
    }

    const startNewSession = async () => {
      setIsLoading(true)
      try {
        const sessionResponse = await startNewChatSession()
        setSessionId(sessionResponse.sessionId)
        setMessages([initialMessage])
      } catch (err) {
        console.error(err)
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

    if (!sessionId) {
      initSession()
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('chatSessionId', sessionId)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId && messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages))
    }
  }, [messages, sessionId])

  useEffect(() => {
    const el = chatContentRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const handleClearChat = async () => {
    try {
      localStorage.removeItem('chatSessionId')
      localStorage.removeItem('chatMessages')
      const sessionResponse = await startNewChatSession()
      setSessionId(sessionResponse.sessionId)
      setMessages([initialMessage])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

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

    try {
      const response = await sendChatMessage(sessionId, trimmedInput)

      const aiMessage: DisplayMessage = {
        id: response.chatId,
        type: 'sender',
        content: response.answer.split('\n'),
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
    <div className="relative flex h-[calc(100vh-81px)] w-full border border-[#e5e7eb] bg-white">
      <KnowledgeSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        handleSelectFileClick={handleSelectFileClick}
        uploadedFileRef={uploadedFileRef}
      />

      <div
        className={cn('chat flex h-full min-w-0 flex-1 flex-col', 'lg:flex', isSidebarOpen ? 'hidden lg:flex' : 'flex')}
      >
        <div className="chat__header flex items-center justify-between p-4 sm:p-6">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="-ml-2 shrink-0 rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            title="Open sidebar"
          >
            <SidebarUrl className="h-5 w-5" />
          </button>
          <div className="chat__title flex w-fit min-w-0 flex-1 items-start gap-2 overflow-hidden text-nowrap text-ellipsis sm:flex-col sm:gap-0">
            <div className="title-header flex min-w-0 flex-1 items-center">
              <MessIcon className="mr-2 h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
              <h1 className="truncate text-base leading-6 font-semibold sm:text-[18px] sm:leading-7">
                Chat with Your Knowledge Base
              </h1>
            </div>
            <p className="hidden w-full text-[14px] text-[#6B7280] sm:block">
              Test chatbot responses based on uploaded documents
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={isLoading}
            className="chat__clear-button group ml-2 flex shrink-0 items-center hover:text-red-500 disabled:opacity-50"
          >
            <TrashIcon className="TrashIcon mr-0 h-[14px] w-[12px] shrink-0 text-[#6B7280] group-hover:text-red-500 sm:mr-1" />
            <p className="hidden text-[14px] text-[#6B7280] group-hover:text-red-500 sm:block">Clear Chat</p>
          </button>
        </div>

        <div ref={chatContentRef} className="chat__content relative flex h-full flex-col overflow-y-auto px-3 sm:px-0">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="message message--sender">
              <p className="animate-pulse">Typing...</p>
            </div>
          )}
          {errorState && !messages.some(m => m.type === 'error') && (
            <div className="message message--sender bg-red-100 py-3 text-red-700">
              <p className="font-bold">Error:</p>
              <p>{errorState}</p>
            </div>
          )}
        </div>

        <div className="chat__footer flex min-h-[88px] flex-col px-3 py-3 sm:min-h-24 sm:px-6 sm:py-4">
          <form
            onSubmit={handleSend}
            action=""
            method="post"
            className="chat__form flex items-center justify-between"
            autoComplete="off"
          >
            <div className="relative flex w-full items-center">
              <input
                type="text"
                name="user-input"
                id="user-input"
                value={userText}
                onChange={e => setUserText(e.target.value)}
                placeholder={!sessionId ? 'Connecting to chat...' : 'Ask a question about your uploaded documents...'}
                disabled={!sessionId}
                className="chat__input h-[40px] w-full rounded-4xl border border-[#D1D5DB] px-3 py-2 pr-[52px] text-sm placeholder:text-[13px] placeholder:leading-[20px] disabled:bg-gray-100 sm:h-[44px] sm:px-4 sm:pr-[60px] sm:placeholder:text-[14px]"
              />
              <button
                type="submit"
                disabled={!sessionId || isLoading || userText.trim().length === 0}
                className="chat__submit absolute top-1/2 right-1 flex h-[32px] w-[32px] -translate-y-1/2 items-center justify-center rounded-full bg-[#003087] transition-all hover:bg-[#002060] disabled:cursor-not-allowed disabled:opacity-50 sm:right-2 sm:h-[36px] sm:w-[40px]"
              >
                <SendIcon className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </form>
          <div className="chat__note mt-2 flex h-4 items-center">
            <InforIcon className="mr-1 h-3 w-3 shrink-0" />
            <p className="truncate py-2.5 text-[11px] font-normal text-[#6B7280] sm:text-[12px]">
              Responses are generated based on uploaded documents only
            </p>
          </div>
        </div>
      </div>
      <UploadModal isOpen={isUploadModalOpen} onClose={handleModalClose} onFilesUploaded={handleFilesUploaded} />
    </div>
  )
}

export default ViewChatPage
