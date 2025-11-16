import { cn } from '@/lib/utils'
import { ReactNode, useEffect } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

const Dialog = ({ open, onClose, children, className }: DialogProps) => {
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog Content */}
      <div className={cn('relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl', className)}>{children}</div>
    </div>
  )
}

const DialogHeader = ({ children }: { children: ReactNode }) => <div className="mb-4">{children}</div>

const DialogTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-xl font-bold text-slate-900">{children}</h2>
)

const DialogDescription = ({ children }: { children: ReactNode }) => (
  <p className="mt-1 text-sm text-slate-600">{children}</p>
)

const DialogFooter = ({ children }: { children: ReactNode }) => (
  <div className="mt-6 flex justify-end gap-3">{children}</div>
)

export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
