import { User } from '@/types/users'

export interface UserTableProps {
  users: User[]
  loading: boolean
  onEdit: (user: User) => void
  onLock: (userId: number) => void
  onUnlock: (userId: number) => void
  onResetPassword: (user: User) => void
}
