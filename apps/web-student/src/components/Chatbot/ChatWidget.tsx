import { useState } from 'react'
import LogoGreenwich from '@/assets/icons/LogoGreenwich.svg?react'
import SendIcon from '@/assets/icons/send.svg?react'
import Expandicon from '@/assets/icons/arrow-expand-alt.svg?react'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed right-10 bottom-10">
      <div
        className={`chat m-12 flex h-fit w-130 flex-col rounded-4xl bg-white shadow-lg shadow-slate-400 transition-all duration-150 ease-in-out ${
          isOpen ? 'origin-bottom-right scale-100' : 'm-0 origin-bottom-right scale-0 opacity-0'
        } `}
      >
        <div className="chat__header flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <LogoGreenwich className="mr-3 h-10 w-10 shrink-0 rounded-full bg-[#00033d] p-1 text-white" />
            <div className="chat__title -mt-1 flex flex-col">
              <h1 className="text-xl leading-7 font-semibold text-[#111827]">Greenwich Smart FAQ</h1>
              <p className="text-sm leading-5 font-normal text-[#6B7280]">Document-based chatbot training system</p>
            </div>
          </div>
          <button className="expand-button" onClick={() => setIsOpen(false)}>
            <Expandicon className="h-7 w-7 shrink-0 cursor-pointer" />
          </button>
        </div>
        <div className="chat__content relative flex h-150 flex-col border-t border-[#E5E7EB]">
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>

          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>
          <div className="message message--receiver">
            <p>Hi!</p>
          </div>

          <div className="message message--sender">
            <p>What ??</p>
          </div>

          {/* Chat content goes here */}
          
        </div>
        <div className="chat__footer relative flex h-20 items-center justify-center rounded-b-4xl ">
          <form action="" className="flex w-full items-center bg-transparent px-10">
            <textarea
              rows={1}
              placeholder="Type your message..."
              className="Chat__footer-input h-12 w-full resize-none rounded-full text-[16px] leading-5"
            />

            <button
              type="submit"
              className="chat__submit absolute top-1/2 -translate-y-1/2 right-11 flex h-10 w-10  cursor-pointer items-center justify-center rounded-full bg-[#003087]"
            >
              <SendIcon className="h-4 w-4 shrink-0" />
            </button>
          </form>
        </div>
      </div>
      <button
        className={`open-button flex h-20 w-20 origin-bottom-right cursor-pointer items-center justify-center rounded-[50%] bg-[#00033d] transition-all duration-150 ease-in-out ${
          isOpen ? 'translate-x-4 translate-y-2 scale-90' : 'origin-bottom-right scale-100'
        } `}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <LogoGreenwich className="h-16 w-16 text-[#ffffff]" />
      </button>
    </div>
  )
}

export default ChatWidget
