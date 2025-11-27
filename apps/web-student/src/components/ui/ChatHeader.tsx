import LogoGreenwich from '@/assets/icons/LogoGreenwich.svg'

interface ChatHeaderProps {
  title?: string
  subtitle?: string
  actionNode?: React.ReactNode
  additionalActions?: React.ReactNode
}

const ChatHeader = ({
  title = 'Greenwich Smart FAQ',
  subtitle = 'AI Assistant for Student Support',
  actionNode,
  additionalActions
}: ChatHeaderProps) => {
  return (
    <div className="chat__header sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-6 py-4">
      {/* Left Side: Logo & Title */}
      <div className="flex items-center">
        <img
          src={LogoGreenwich}
          alt="Greenwich Logo"
          width={40}
          height={40}
          className="mr-3 shrink-0 rounded-full bg-[#00033d] p-1"
        />
        <div className="chat__title -mt-1 flex flex-col">
          <h1 className="text-lg leading-7 font-semibold text-[#111827]">{title}</h1>
          <p className="text-sm leading-5 font-normal text-[#6B7280]">{subtitle}</p>
        </div>
      </div>

      {/* Right Side: Actions */}
      <div className="flex items-center gap-3">
        {/* Render các nút phụ (Delete) nếu có */}
        {additionalActions && <div className="flex items-center">{additionalActions}</div>}

        {/* Render nút chính (Close/Expand) */}
        {actionNode && <div>{actionNode}</div>}
      </div>
    </div>
  )
}

export default ChatHeader
