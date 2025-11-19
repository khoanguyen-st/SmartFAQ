import { useState, FormEvent } from 'react'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Select } from '../ui'
import { CreateUserRequest, createUser } from '@/lib/api'
import { validateEmail, validateUsername, CAMPUS_OPTIONS, DEPARTMENT_OPTIONS } from '@/lib/validation'

interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const CreateUserDialog = ({ open, onClose, onSuccess }: CreateUserDialogProps) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    email: '',
    campus: 'DN',
    departments: [],
    role: 'Staff',
    password: '',
    status: 'Active'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    const emailError = validateEmail(formData.email)
    if (emailError) newErrors.email = emailError

    const usernameError = validateUsername(formData.username)
    if (usernameError) newErrors.username = usernameError

    if (!selectedDepartment) {
      newErrors.department = 'Department is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      // Auto-generate a temporary password (backend will handle activation email)
      const tempPassword = 'TempPass123!'

      await createUser({
        ...formData,
        departments: [selectedDepartment],
        password: tempPassword
      })

      // Reset form
      setFormData({
        username: '',
        email: '',
        campus: 'DN',
        departments: [],
        role: 'Staff',
        password: '',
        status: 'Active'
      })
      setSelectedDepartment('')
      setErrors({})
      onSuccess()
      onClose()
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to create user' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        username: '',
        email: '',
        campus: 'DN',
        departments: [],
        role: 'Staff',
        password: '',
        status: 'Active'
      })
      setSelectedDepartment('')
      setErrors({})
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <p className="text-sm text-slate-600 mt-1">Create account for Student Affairs Department staff.</p>
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

          {/* Username */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Username <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value })
                if (errors.username) setErrors({ ...errors, username: '' })
              }}
              error={!!errors.username}
              placeholder="Enter username"
              disabled={loading}
            />
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          </div>

          {/* Campus */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Campus <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.campus}
              onChange={(e) => setFormData({ ...formData, campus: e.target.value as 'DN' | 'HCM' | 'HN' | 'CT' })}
              disabled={loading}
            >
              <option value="" disabled>
                Choose campus
              </option>
              {CAMPUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Department - Single Select Dropdown */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Department <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value)
                if (errors.department) setErrors({ ...errors, department: '' })
              }}
              error={!!errors.department}
              disabled={loading}
            >
              <option value="">Choose department</option>
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
            {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
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
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
