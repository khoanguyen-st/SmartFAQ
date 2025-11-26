import { useState } from 'react'
import { useChat } from '@/hooks/useChat'
import { ChatContainer } from './ChatContainer'
import LogoGreenwich from '@/assets/icons/LogoGreenwich.svg'
import Expandicon from '@/assets/icons/arrow-expand-alt.svg'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)

  const { sessionId, messages, isLoading, sendMessage } = useChat()

  const handleExpand = () => {
    if (sessionId) {
      const url = `/chat?sessionId=${sessionId}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="fixed right-10 bottom-10 z-999">
      <div
        className={`chat flex flex-col overflow-hidden rounded-4xl bg-white shadow-2xl shadow-slate-400 transition-all duration-300 ease-in-out ${
          isOpen
            ? 'pointer-events-auto m-10 h-150 w-100 translate-y-0 opacity-100'
            : 'pointer-events-none h-0 w-0 opacity-0 transition-all duration-200 ease-in-out'
        } origin-bottom-right`}
      >
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          sessionId={sessionId}
          headerAction={
            <button
              className="expand-button rounded-lg p-2 transition hover:bg-gray-100"
              onClick={handleExpand}
              title="Open full page"
            >
              <img src={Expandicon} alt="Collapse" height={20} width={20} className="shrink-0 cursor-pointer" />
            </button>
          }
        />
      </div>

      <button
        className={`open-button flex h-16 w-16 origin-bottom-right cursor-pointer items-center justify-center rounded-[50%] bg-[#00033d] transition-all duration-200 ease-in-out ${
          isOpen
            ? 'translate-x-4 translate-y-2 scale-80 hover:scale-82'
            : 'origin-bottom-right scale-100 hover:scale-95'
        } `}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <img src={LogoGreenwich} alt="Greenwich Logo" width={55} height={60} className="rounded-full" />
      </button>
    </div>
  )
}

export default ChatWidget
