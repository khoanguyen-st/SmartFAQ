import { useState, useEffect, FormEvent } from 'react'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from '../ui'
import { User, UpdateUserRequest, updateUser } from '@/lib/api'
import { validateEmail } from '@/lib/validation'

interface EditUserDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

export const EditUserDialog = ({ open, onClose, onSuccess, user }: EditUserDialogProps) => {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email
      })
    }
  }, [user])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.email) {
      const emailError = validateEmail(formData.email)
      if (emailError) newErrors.email = emailError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!user) return
    if (!validateForm()) return

    setLoading(true)
    try {
      await updateUser(user.id, formData)
      setErrors({})
      onSuccess()
      onClose()
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to update user' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setErrors({})
      onClose()
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Edit User Account</DialogTitle>
          <p className="text-sm text-slate-600 mt-1">
            Editing user: <span className="font-semibold">{user.username}</span>
          </p>
        </DialogHeader>

        <DialogContent>
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                if (errors.email) setErrors({ ...errors, email: '' })
              }}
              error={!!errors.email}
              placeholder="Enter email"
              disabled={loading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {errors.submit && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
