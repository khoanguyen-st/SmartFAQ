import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600',
            secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-600',
            outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus:ring-slate-500',
            ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500'
          }[variant],
          // Sizes
          {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg'
          }[size],
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export default Button
