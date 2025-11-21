import { cn } from '@/lib/utils'
import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-lg border px-3.5 py-2.5 text-base transition-colors focus:ring-2 focus:outline-none resize-none',
        error
          ? 'border-red-300 focus:border-red-600 focus:ring-red-600/20'
          : 'focus:border-primary-600 focus:ring-primary-600/20 border-indigo-200',
        className
      )}
      {...props}
    />
  )
})

Textarea.displayName = 'Textarea'

export default Textarea
