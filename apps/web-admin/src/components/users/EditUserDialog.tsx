import { useState, useEffect, FormEvent } from 'react'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Select } from '../ui'
import { User, UpdateUserRequest, updateUser } from '@/lib/api'
import { 
  validateUsername,
  validateDepartments,
  CAMPUS_OPTIONS,
  DEPARTMENT_OPTIONS
} from '@/lib/validation'

interface EditUserDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

export const EditUserDialog = ({ open, onClose, onSuccess, user }: EditUserDialogProps) => {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    username: '',
    campus: 'DN',
    departments: []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set())

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        campus: user.campus,
        departments: user.departments
      })
      setSelectedDepartments(new Set(user.departments))
    }
  }, [user])

  const handleDepartmentToggle = (dept: string) => {
    const newSet = new Set(selectedDepartments)
    if (newSet.has(dept)) {
      newSet.delete(dept)
    } else {
      newSet.add(dept)
    }
    setSelectedDepartments(newSet)
    setFormData({ ...formData, departments: Array.from(newSet) })
    
    // Clear department error if any
    if (newSet.size > 0 && errors.departments) {
      setErrors({ ...errors, departments: '' })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.username) {
      const usernameError = validateUsername(formData.username)
      if (usernameError) newErrors.username = usernameError
    }

    if (formData.departments) {
      const deptError = validateDepartments(formData.departments)
      if (deptError) newErrors.departments = deptError
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
    <Dialog open={open} onClose={handleClose} className="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Edit User Account</DialogTitle>
          <p className="text-sm text-slate-600 mt-1">
            Editing user: <span className="font-semibold">{user.email}</span>
          </p>
        </DialogHeader>

        <DialogContent>
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
              {CAMPUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Departments - Multi-select with checkboxes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Departments <span className="text-red-500">*</span>
            </label>
            <div className="rounded-lg border border-indigo-200 p-3 max-h-48 overflow-y-auto">
              {DEPARTMENT_OPTIONS.map((dept) => (
                <label key={dept} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-slate-50 px-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedDepartments.has(dept)}
                    onChange={() => handleDepartmentToggle(dept)}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                    disabled={loading}
                  />
                  <span className="text-sm text-slate-700">{dept}</span>
                </label>
              ))}
            </div>
            {errors.departments && <p className="mt-1 text-sm text-red-600">{errors.departments}</p>}
            {selectedDepartments.size > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Selected: {Array.from(selectedDepartments).join(', ')}
              </p>
            )}
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
