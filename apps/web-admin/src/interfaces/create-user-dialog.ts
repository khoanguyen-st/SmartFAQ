import type { CreateUserRequest } from '../../types/users'

export interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onSubmit?: (data: CreateUserRequest) => Promise<void> | void
  onSuccess?: () => void
}
