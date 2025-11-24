import type { User } from '../../types/users'

export interface EditUserDialogProps {
  open: boolean
  user: User | null
  onClose: () => void
  onSubmit?: (id: number, data: Partial<User>) => Promise<void> | void
  onSuccess?: () => void
}
