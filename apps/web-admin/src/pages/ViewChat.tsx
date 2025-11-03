import MessIcon from '@/assets/messager.svg?react'
import SendIcon from '@/assets/send.svg?react'
import InforIcon from '@/assets/i-icon.svg?react'
import TrashIcon from '@/assets/trash-icon.svg?react'
import PdfNoFill from '@/assets/pdf-no-fill.svg?react'

const ViewChatPage = () => {
  return (
    <div className="flex h-full w-full bg-white">
      <div className="details w-[50%]"></div>
      <div className="chat flex h-[calc(100vh-100px)] w-[50%] flex-col">
        <div className="chat__header flex items-center justify-between px-6 py-4">
          <div className="chat__title flex flex-col">
            <div className="title-header flex">
              <MessIcon className="mr-2 h-[24px] w-[24px]" />
              <h1 className="text-[18px] leading-7 font-semibold">Chat with Your Knowledge Base</h1>
            </div>
            <p className="text-[#6B7280]">Test chatbot responses based on uploaded documents</p>
          </div>
          <button type="button" className="chat__clear-button group flex w-[90px] items-center hover:text-red-500">
            <TrashIcon className="TrashIcon mr-1.5 h-[14px] w-[12px] text-[#6B7280] group-hover:text-red-500" />
            <p className="text-[14px] text-[#6B7280] group-hover:text-red-500">Clear Chat</p>
          </button>
        </div>

        <div className="chat__content flex h-full flex-col">
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
            <p>Hello world</p>
            <div className="message__reference flex items-center">
              <PdfNoFill className="mr-2 h-3 w-3" />
              <p>Source: admission_guidelines.pdf (Page 3-4)</p>
            </div>
          </div>

          <div className="message message--receiver"></div>

          <div className="message message--sender"></div>

          <div className="message message--receiver"></div>

          <div className="message message--sender"></div>
        </div>

        <div className="chat__footer flex h-[96px] flex-col px-6 py-4">
          <form action="" method="post" className="chat__form flex items-center justify-between" autoComplete="off">
            <input
              type="text"
              name="user-input"
              id="user-input"
              placeholder="Ask a question about your uploaded documents..."
              className="chat__input mr-3 h-[40px] w-full rounded-[8px] border border-[#D1D5DB] p-4 placeholder:text-[14px] placeholder:leading-[20px]"
            />
            <button
              type="submit"
              className="chat__submit flex h-[40px] w-[48px] items-center justify-center rounded-[8px] bg-[#003087] hover:cursor-pointer"
            >
              <SendIcon className="h-[16px] w-[16px] fill-white" />
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
