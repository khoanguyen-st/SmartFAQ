import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface ChatContainerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'welcome' | 'history' | 'form' | 'feedback'
}

const ChatContainer = ({ className, variant = 'welcome', ...props }: ChatContainerProps) => {
  return (
    <section
      className={cn(
        'rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/8',
        variant === 'history' && 'relative flex max-h-[520px] min-h-[320px] flex-1 flex-col gap-4 overflow-y-auto',
        className
      )}
      {...props}
    />
  )
}

export default ChatContainer
