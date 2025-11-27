export type CreateUserDialogPayload = {
  username: string
  email: string
  password: string
  role: string
  campus: string
  phone?: string
  address?: string
  image?: string
}

export interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onSubmit?: (data: CreateUserDialogPayload) => Promise<void> | void
  onSuccess?: () => void
}
