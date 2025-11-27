import type { User } from '@/types/users'

export interface UserActionsProps {
  user: User
  onEdit: (user: User) => void
  onLock: (userId: number) => void
  onUnlock: (userId: number) => void
  onResetPassword: (userId: number) => void
  variant?: 'desktop' | 'mobile'
}
