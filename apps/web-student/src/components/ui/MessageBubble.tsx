import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface MessageBubbleProps extends HTMLAttributes<HTMLDivElement> {
  author: 'user' | 'assistant'
}

const MessageBubble = ({ className, author, children, ...props }: MessageBubbleProps) => {
  return (
    <div className={cn('flex flex-col gap-1', author === 'user' ? 'items-end' : 'items-start', className)} {...props}>
      <span
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-base shadow-md shadow-slate-900/12',
          author === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-900'
        )}
      >
        {children}
      </span>
    </div>
  )
}

export default MessageBubble
