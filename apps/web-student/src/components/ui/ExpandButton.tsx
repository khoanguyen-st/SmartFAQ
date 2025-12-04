import ArrowIcon from '@/assets/icons/arrow-45.svg?react'

interface ExpandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isExpanded: boolean
}

const ExpandButton = ({ onClick, className, ...props }: ExpandButtonProps) => {
  return (
    <div>
      <button
        onClick={onClick}
        className={`flex h-6 w-[25px] cursor-pointer flex-col justify-around text-[#003087] hover:text-[#a6a6a6] ${className || ''}`}
        {...props}
      >
        <ArrowIcon className={`h-3 w-3 self-end transition-all duration-500 ease-in-out`} />
        <ArrowIcon className={`h-3 w-3 rotate-180 self-start transition-all duration-500 ease-in-out`} />
      </button>
    </div>
  )
}

export default ExpandButton
