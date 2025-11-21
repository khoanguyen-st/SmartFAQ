import { cn } from '@/lib/utils'
import { ReactNode, useEffect } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export const Dialog = ({ open, onClose, children, className }: DialogProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className={cn('relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl', className)}>
        {children}
      </div>
    </div>
  )
}

export const DialogHeader = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('mb-6', className)}>{children}</div>
)

export const DialogTitle = ({ children, className }: { children: ReactNode; className?: string }) => (
  <h2 className={cn('text-2xl font-bold text-slate-900', className)}>{children}</h2>
)

export const DialogContent = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('space-y-4', className)}>{children}</div>
)

export const DialogFooter = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('mt-6 flex justify-end gap-3', className)}>{children}</div>
)
