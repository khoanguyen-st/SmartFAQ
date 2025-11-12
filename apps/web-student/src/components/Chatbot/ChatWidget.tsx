import { useState } from 'react'
import GraduateIcon from '@/assets/icons/graduate.svg?react'
import SendIcon from '@/assets/icons/send.svg?react'
import GranduateOutline from '@/assets/icons/graduate-outline.svg?react'
import CloseIcon from '@/assets/icons/close-x.svg?react'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed right-4 bottom-4">
      <div
        className={`chat flex h-fit w-200 flex-col rounded-3xl bg-white shadow-lg shadow-slate-900/8 transition-all duration-300 ease-in-out ${
          isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        } `}
        style={{ transformOrigin: 'bottom right' }}
      >
        <div className="chat__header flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <GraduateIcon className="mr-3 h-8 w-8 rounded-lg bg-[#003087] p-1.75" />
            <div className="chat__title -mt-1 flex flex-col">
              <h1 className="text-xl leading-7 font-semibold text-[#111827]">Greenwich Smart FAQ</h1>
              <p className="text-sm leading-5 font-normal text-[#6B7280]">Document-based chatbot training system</p>
            </div>
          </div>
          <button className="close-button" onClick={() => setIsOpen(false)}>
            <CloseIcon className="h-7 w-7 shrink-0 cursor-pointer" />
          </button>
        </div>
        <div className="chat__content relative flex h-100 flex-col border-t border-b border-[#E5E7EB]">
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>

          <div className="message message--receiver">
            <p>Can you explain more?</p>
          </div>

          <div className="message message--sender">
            <p>I don't understand.</p>
          </div>

          <div className="message message--receiver">
            <p>Can you explain more?</p>
          </div>

          <div className="message message--sender">
            <p>
              I don't understand. I don't understand.I don't understand.I don't understand.I don't understand.I don't
              understand.I don't understand.I don't understand.I don't understand.I don't understand.I don't
              understand.I don't understand.I don't understand.
            </p>
          </div>

          <div className="message message--receiver">
            <p>
              Can you explain more? Can you explain more? Can you explain more?Can you explain more? Can you explain
              more? Can you explain more? Can you explain more?
            </p>
          </div>

          <div className="message message--sender">
            <p>I don't understand.</p>
          </div>
          <div className="message message--receiver">
            <p>Can you explain more?</p>
          </div>

          <div className="message message--sender">
            <p>I don't understand.</p>
          </div>

          {/* Chat content goes here */}
        </div>
        <div className="chat__footer">
          <form action="" className="flex items-center rounded-b-3xl bg-[#003087] px-4 py-2">
            <textarea
              rows={1}
              placeholder="Type your message..."
              className="Chat__footer-input mx-3 h-12 w-full resize-none px-2 py-3 text-lg leading-7"
            />

            <button type="submit" className="chat__submit flex h-10 w-12 cursor-pointer items-center justify-center">
              <SendIcon className="h-4 w-4 shrink-0" />
            </button>
          </form>
        </div>
      </div>
      <button
        className={`open-button flex h-18 w-18 cursor-pointer items-center justify-center rounded-[50%] bg-[#003087] transition-all duration-300 ease-in-out ${
          isOpen ? 'pointer-events-none scale-95 opacity-0' : 'scale-100 opacity-100'
        } `}
        onClick={() => setIsOpen(true)}
      >
        <GranduateOutline className="h-8 w-8" />
      </button>
    </div>
  )
}

export default ChatWidget
