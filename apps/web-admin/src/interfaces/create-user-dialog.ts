import { User } from '@/types/users'

export interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateUserDialogPayload) => Promise<void>
  onSuccess?: () => void
  users?: User[]
  loading?: boolean
}

export interface CreateUserDialogPayload {
  username: string
  email: string
  password: string
  role: string
  campus: string
  phone?: string
}
