import { useState } from 'react'
import LogoGreenwich from '@/assets/icons/LogoGreenwich.svg?react'
import SendIcon from '@/assets/icons/send.svg?react'
import CloseIcon from '@/assets/icons/close-x.svg?react'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed right-10 bottom-10">
      <div
        className={`chat flex h-fit w-150 flex-col rounded-3xl bg-white shadow-lg shadow-slate-400 transition-all duration-150 ease-in-out ${
          isOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-4 scale-95 opacity-0'
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
          <button className="close-button" onClick={() => setIsOpen(false)}>
            <CloseIcon className="h-7 w-7 shrink-0 cursor-pointer" />
          </button>
        </div>
        <div className="chat__content relative flex h-150 flex-col border-t border-b border-[#E5E7EB]">
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>

          {/* Chat content goes here */}
        </div>
        <div className="chat__footer flex h-20 items-center justify-center">
          <form action="" className="flex w-full items-center rounded-b-3xl bg-white px-6 py-2">
            <textarea
              rows={1}
              placeholder="Type your message..."
              className="Chat__footer-input mr-4 h-10 w-full resize-none rounded-lg px-2 py-1 text-[14px] leading-7"
            />

            <button
              type="submit"
              className="chat__submit flex h-10 w-14 cursor-pointer items-center justify-center rounded-lg bg-[#003087]"
            >
              <SendIcon className="h-4 w-4 shrink-0" />
            </button>
          </form>
        </div>
      </div>
      <button
        className={`open-button flex h-15 w-15 origin-bottom-right cursor-pointer items-center justify-center rounded-[50%] bg-[#00033d] transition-all duration-150 ease-in-out ${
          isOpen ? 'pointer-events-none translate-y-2 scale-95 opacity-0' : 'translate-y-0 scale-100 opacity-100'
        } `}
        onClick={() => setIsOpen(true)}
      >
        <LogoGreenwich className="h-11 w-11 text-[#ffffff]" />
      </button>
    </div>
  )
}

export default ChatWidget
