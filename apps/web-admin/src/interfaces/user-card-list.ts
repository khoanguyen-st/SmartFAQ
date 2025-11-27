import type { User } from '@/types/users'

export interface UserCardListProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onLock: (userId: number) => void;
  onUnlock: (userId: number) => void;
}
