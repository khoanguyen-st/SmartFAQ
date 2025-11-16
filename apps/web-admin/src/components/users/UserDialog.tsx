import { useState, useEffect, type FormEvent } from 'react'
import { Button, Input, Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui'
import type { CreateUserRequest, UpdateUserRequest } from '../../types/user'
import type { UserDialogProps } from '../../interfaces/UserDialogProps'
import { EMAIL_REGEX, VALIDATION_MESSAGES } from '../../constants/validation'

const UserDialog = ({ open, onClose, onSubmit, user, mode }: UserDialogProps) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (mode === 'update' && user) {
        setFormData({
          username: user.username,
          email: user.email,
          password: ''
        })
      } else {
        setFormData({
          username: '',
          email: '',
          password: ''
        })
      }
      setErrors({})
    }
  }, [open, mode, user])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Email validation for both create and update
    if (!formData.email.trim()) {
      newErrors.email = VALIDATION_MESSAGES.EMAIL_REQUIRED
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = VALIDATION_MESSAGES.EMAIL_INVALID
    }

    // Username validation for create mode
    if (mode === 'create') {
      if (!formData.username.trim()) {
        newErrors.username = VALIDATION_MESSAGES.USERNAME_REQUIRED
      }
      if (!formData.password.trim()) {
        newErrors.password = VALIDATION_MESSAGES.PASSWORD_REQUIRED
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (mode === 'create') {
        await onSubmit({
          username: formData.username,
          email: formData.email,
          password: formData.password
        } as CreateUserRequest)
      } else {
        const updateData: UpdateUserRequest = {
          username: formData.username,
          email: formData.email
        }

        await onSubmit(updateData)
      }
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : VALIDATION_MESSAGES.ERROR_OCCURRED
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Account' : 'Update Account'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create account for Student Affairs Department staff.'
              : 'Update account for Student Affairs Department staff.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              error={!!errors.email}
              disabled={isSubmitting}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {mode === 'create' && (
            <>
              <div>
                <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  error={!!errors.username}
                  disabled={isSubmitting}
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  error={!!errors.password}
                  disabled={isSubmitting}
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>
            </>
          )}

          {errors.submit && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{errors.submit}</div>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

export default UserDialog
