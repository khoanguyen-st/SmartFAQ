import { User } from '@/types/users'

export interface UserActionsProps {
  user: User
  onEdit?: (user: User) => void
  onLock?: (userId: number) => void 
  onUnlock?: (userId: number) => void 
  onResetPassword?: (user: User) => void
  variant?: 'desktop' | 'mobile'
}