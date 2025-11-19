import type { User, CreateUserRequest, UpdateUserRequest } from '../types/user'

export interface UserDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>
  user?: User | null
  mode: 'create' | 'update'
}
