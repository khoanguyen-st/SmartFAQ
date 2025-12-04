import React, { useState, useEffect } from 'react'
import type { CreateUserDialogProps, CreateUserDialogPayload } from '@/interfaces/create-user-dialog'

const CAMPUS_OPTIONS = [
  { label: 'Hà Nội', value: 'HN' },
  { label: 'Hồ Chí Minh', value: 'HCM' },
  { label: 'Đà Nẵng', value: 'DN' },
  { label: 'Cần Thơ', value: 'CT' }
]

const initialFormState: CreateUserDialogPayload = {
  username: '',
  email: '',
  password: '',
  role: '',
  campus: '',
  phone: ''
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onClose, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<CreateUserDialogPayload>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [campusOpen, setCampusOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setFormData(initialFormState)
      setErrors({})
      setCampusOpen(false)
    }
  }, [open])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.username.trim()) newErrors.username = 'Username is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange = (field: keyof CreateUserDialogPayload, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field])
      setErrors(prev => {
        const newErr = { ...prev }
        delete newErr[field]
        return newErr
      })
  }

  const getCampusLabel = (value: string) => {
    const option = CAMPUS_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : value
  }

  const handleSelectCampus = (value: string) => {
    handleChange('campus', value)
    setCampusOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full flex-col rounded-3xl bg-white shadow-2xl sm:max-w-xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Create New User</h2>
          <p className="mt-1 text-sm text-slate-500">Enter user details to create a new account</p>
        </div>

        {/* Body - Có pb-28 để chừa chỗ cho dropdown */}
        <div className="px-6 py-2 pb-28 sm:px-8">
          <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                disabled={loading}
                onChange={e => handleChange('username', e.target.value)}
                placeholder="Enter username"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none ${
                  errors.username
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.username && <span className="mt-1 text-xs text-red-500">{errors.username}</span>}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                disabled={loading}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="Enter email"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.email && <span className="mt-1 text-xs text-red-500">{errors.email}</span>}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                disabled={loading}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                disabled={loading}
                onChange={e => handleChange('password', e.target.value)}
                placeholder="Enter password"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.password && <span className="mt-1 text-xs text-red-500">{errors.password}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Campus (Bên trái) */}
              <div className="relative">
                <label className="mb-1 block text-sm font-medium text-slate-700">Campus</label>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setCampusOpen(prev => !prev)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <span>{getCampusLabel(formData.campus)}</span>
                  <span className="text-slate-400">▾</span>
                </button>

                {campusOpen && (
                  <div className="absolute left-0 z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                    <ul className="space-y-3 text-sm">
                      {CAMPUS_OPTIONS.map(option => {
                        const isChecked = formData.campus === option.value
                        return (
                          <li key={option.value} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="campus"
                              className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                              checked={isChecked}
                              onChange={() => handleSelectCampus(option.value)}
                            />
                            <label
                              onClick={() => handleSelectCampus(option.value)}
                              className="flex-1 cursor-pointer text-slate-700 select-none"
                            >
                              {option.label}
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Role (Bên phải) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <div className="relative">
                  <select
                    value={formData.role}
                    disabled={loading}
                    onChange={e => handleChange('role', e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400">
                    ▾
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="rounded-b-3xl border-t border-slate-100 bg-white px-6 py-4 sm:px-8">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-slate-200 px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              form="create-user-form"
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#003087] px-8 py-2 text-sm font-semibold text-white hover:bg-[#002060] disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
