import { useState, useEffect, useRef } from 'react'
import MessIcon from '@/assets/messager.svg?react'
import SendIcon from '@/assets/send.svg?react'
import InforIcon from '@/assets/i-icon.svg?react'
import TrashIcon from '@/assets/trash-icon.svg?react'
import PdfNoFill from '@/assets/pdf-no-fill.svg?react'
import ImageNofill from '@/assets/image-no-fill.svg?react'
import TxtNoFill from '@/assets/txt-no-fill.svg?react'

const initialMessage = {
  id: Date.now(),
  type: 'system', // Use a 'system' type for the welcome message
  content: ['Welcome to AI Smart FAQ.']
}

const mockAiResponse = (userText: string) => {
  const lowerText = userText.toLowerCase()

  if (lowerText.includes('admission') || lowerText.includes('requirements')) {
    return {
      id: Date.now() + 1,
      type: 'sender', // AI/Bot response
      content: [
        'Based on the admission guidelines, undergraduate programs require:',
        'High school diploma or equivalent',
        'Minimum GPA of 3.0',
        'SAT score of 1200+ or ACT score of 26+',
        'Two letters of recommendation',
        'Personal statement essay'
      ],
      source: {
        file: 'admission_guidelines.pdf',
        pages: 'Page 3-4'
      }
    }
  } else if (lowerText.includes('photo') || lowerText.includes('photos')) {
    return {
      id: Date.now() + 1,
      type: 'sender', // AI/Bot response
      content: [
        '**********************I',
        '*****            *****I',
        '*****            *****I',
        '*****            *****I',
        '*****            *****I',
        '*****            *****I',
        '*****            *****I',
        '*****            *****I',
        '*****            *****I',
        '**********************I'
      ],
      source: {
        file: 'image.jpg'
      }
    }
  }

  return {
    id: Date.now() + 1,
    type: 'sender',
    content: ['I am a mock response. I received your message:', `"${userText}"`],
    source: {
      file: 'mock_source.pdf',
      pages: 'Page 1'
    }
  }
}

// Add type annotation for message prop
type ChatMessageProps = {
  message: {
    type: string
    content: string[]
    source?: {
      file: string
      pages?: string
    }
  }
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  if (message.type === 'system') {
    return (
      <div className="self-center text-center text-sm text-[#6B7280]">
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
        {message.source && (
          <div className="message__reference mt-2 flex items-center border-t border-gray-300 pt-2">
            {/* Render icon based on file extension.
              This block implements the logic from your query, using lucide-react icons
              as the custom SVGs are not available in this environment.
            */}
            {(() => {
              const filename = message.source.file.toLowerCase()
              if (filename.endsWith('.pdf')) {
                return <PdfNoFill className="mr-2 h-3 w-3 shrink-0" />
              } else if (filename.endsWith('.jpg') || filename.endsWith('.gif') || filename.endsWith('.png')) {
                return <ImageNofill className="mr-2 h-3 w-3 shrink-0" />
              } else if (filename.endsWith('.txt')) {
                return <TxtNoFill className="mr-2 h-3 w-3 shrink-0" />
              }
              // Default fallback icon
              return <TxtNoFill className="mr-2 h-3 w-3 shrink-0" />
            })()}
            <p className="truncate">
              Source: {message.source.file}
              {/* Only show pages if they exist */}
              {message.source.pages && ` (${message.source.pages})`}
            </p>
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
  const [messages, setMessages] = useState([initialMessage])
  const [userText, setUserText] = useState('')

  const chatContentRef = useRef(null)

  useEffect(() => {
    const el = chatContentRef.current as HTMLDivElement | null
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const handleClearChat = () => {
    setMessages([initialMessage])
  }

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmedInput = userText.trim()

    if (!trimmedInput) return

    const newUserMessage = {
      id: Date.now(),
      type: 'receiver', //
      content: [trimmedInput]
    }

    const aiResponse = mockAiResponse(trimmedInput)
    setMessages(prevMessages => [...prevMessages.filter(m => m.type !== 'system'), newUserMessage])

    setTimeout(() => {
      setMessages(prevMessages => [...prevMessages, aiResponse])
    }, 500)

    setUserText('')
  }

  return (
    <div className="flex h-full w-full bg-white">
      <div className="details w-[50%]"></div>
      <div className="chat flex h-[calc(100vh-100px)] w-[50%] flex-col">
        <div className="chat__header flex items-center justify-between px-6 py-4">
          <div className="chat__title flex flex-col">
            <div className="title-header flex">
              <MessIcon className="mr-2 h-[24px] w-[24px] shrink-0" />
              <h1 className="text-[18px] leading-7 font-semibold">Chat with Your Knowledge Base</h1>
            </div>
            <p className="text-[14px] text-[#6B7280]">Test chatbot responses based on uploaded documents</p>
          </div>
          <button
            type="button"
            onClick={handleClearChat}
            className="chat__clear-button group flex w-[90px] items-center hover:text-red-500"
          >
            <TrashIcon className="TrashIcon mr-1.5 h-[14px] w-[12px] shrink-0 text-[#6B7280] group-hover:text-red-500" />
            <p className="text-[14px] text-[#6B7280] group-hover:text-red-500">Clear Chat</p>
          </button>
        </div>

        <div ref={chatContentRef} className="chat__content flex h-full flex-col overflow-y-auto">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>

        {/* <div className="chat__content relative flex h-full flex-col">
          <div className="message message--receiver">
            <p>"On Thursday:</p>
            <p>- Finished refine and clean up code for the team project.</p>
            <p>- Explored Smart-FAQ repository</p>
            <p>- Researched about vector data and how it store in database</p>
            <p>Today:</p>
            <p>- Completing setup of local environment and docker for SmartFAQ project.</p>
            <p>- Read and try to understand the requirements of the task to be done.</p>
            <p>Issue:</p>
            <p>- Still don't understand what I need to do and where to start. A bit confused"</p>
          </div>

          <div className="message message--sender">
            <p>Based on the admission guidelines, undergraduate programs require:</p>
            <p>High school diploma or equivalent</p>
            <p>Minimum GPA of 3.0</p>
            <p>SAT score of 1200+ or ACT score of 26+</p>
            <p>Two letters of recommendation</p>
            <p>Personal statement essay</p>
            <div className="message__source flex items-center">
              <PdfNoFill className="mr-2 h-3 w-3 shrink-0" />
              <p>Source: admission_guidelines.pdf (Page 3-4)</p>
            </div>
          </div>

          <div className="message message--receiver"></div>

          <div className="message message--sender"></div>

          <div className="message message--receiver"></div>

          <div className="message message--sender"></div>
        </div> */}

        <div className="chat__footer flex h-[96px] flex-col px-6 py-4">
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
              placeholder="Ask a question about your uploaded documents..."
              className="chat__input mr-3 h-[40px] w-full rounded-[8px] border border-[#D1D5DB] p-4 placeholder:text-[14px] placeholder:leading-[20px]"
            />
            <button
              type="submit"
              className="chat__submit flex h-[40px] w-[48px] items-center justify-center rounded-[8px] bg-[#003087] hover:cursor-pointer"
            >
              <SendIcon className="h-[16px] w-[16px]" />
            </button>
          </form>
          <div className="chat__note mt-3 flex h-[16px] items-center">
            <InforIcon />
            <p className="px-[5px] py-[10px] text-[12px] font-normal text-[#6B7280]">
              Responses are generated based on uploaded documents only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewChatPage
