import { ReactNode } from 'react'

export interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export interface DialogHeaderProps {
  children: ReactNode
  className?: string
}

export interface DialogTitleProps {
  children: ReactNode
  className?: string
}

export interface DialogContentProps {
  children: ReactNode
  className?: string
}

export interface DialogFooterProps {
  children: ReactNode
  className?: string
}
