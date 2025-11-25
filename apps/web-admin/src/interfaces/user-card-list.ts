import type { User } from '@/types/users'

export interface UserCardListProps {
  users: User[]
  loading: boolean
  page: number
  pageSize: number
  onEdit: (user: User) => void
  onLock: (userId: number) => void
  onUnlock: (userId: number) => void
  onResetPassword: (userId: number) => void
}
