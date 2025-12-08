import { User } from '@/types/users'

export interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateUserDialogPayload) => Promise<void>
  onSuccess: () => void
  users?: User[]
}
export interface CreateUserDialogPayload {
  username: string
  email: string
  password: string
  role: string
  campus: string
  department_ids?: number[]
}
