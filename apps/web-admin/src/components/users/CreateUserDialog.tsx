import React, { useMemo, useState, useEffect } from 'react'
import type { CreateUserDialogProps, CreateUserDialogPayload } from '@/interfaces/create-user-dialog'
import { fetchDepartments, type IDepartment } from '@/services/department.services'
import ChevronDown from '@/assets/icons/chevron-down.svg'
import eyeIcon from '@/assets/icons/eye.svg'
import eyeOffIcon from '@/assets/icons/eye-off.svg'

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSubmit,
  onSuccess,
  users = []
}) => {
  const [formData, setFormData] = useState<CreateUserDialogPayload>({
    username: '',
    email: '',
    password: '',
    role: '',
    campus: '',
    department_ids: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<IDepartment[]>([])

  useEffect(() => {
    if (open) {
      fetchDepartments()
        .then(setDepartments)
        .catch(err => console.error('Failed to load departments:', err))
    }
  }, [open])

  const [showPassword, setShowPassword] = useState(false)

  const isSubmitDisabled = useMemo(() => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    const isPasswordValid = passwordRegex.test(formData.password)

    const baseValidation =
      !formData.email ||
      !formData.username ||
      !formData.password ||
      !isPasswordValid ||
      !formData.role ||
      !formData.campus

    if (formData.role === 'staff') {
      return baseValidation || !formData.department_ids || formData.department_ids.length === 0
    }

    return baseValidation
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const isDuplicate = users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())
    if (isDuplicate) {
      setError('Username already exists')
      return
    }
    if (formData.role === 'staff' && (!formData.department_ids || formData.department_ids.length === 0)) {
      setError('Staff users must be assigned to at least one department')
      return
    }

    try {
      setLoading(true)
      await onSubmit?.(formData)
      onSuccess?.()
      onClose()
      setFormData({ username: '', email: '', password: '', role: '', campus: '', department_ids: [] })
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleDepartment = (deptId: number) => {
    setFormData(prev => ({
      ...prev,
      department_ids: prev.department_ids?.includes(deptId)
        ? prev.department_ids.filter(id => id !== deptId)
        : [...(prev.department_ids || []), deptId]
    }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
      {/* CÁC THAY ĐỔI CHÍNH:
         1. sm:max-w-2xl: Tăng độ rộng Modal to hơn (trước là xl).
         2. sm:min-h-[600px]: Đặt chiều cao tối thiểu để Modal luôn cao, tạo cảm giác rộng rãi.
      */}
      <div className="flex w-full flex-col overflow-hidden bg-white shadow-2xl transition-all sm:max-h-[90vh] sm:min-h-[600px] sm:max-w-2xl sm:rounded-3xl">
        {/* Header cố định */}
        <div className="flex-none border-b border-slate-100 px-8 py-6">
          <h2 className="text-2xl font-semibold text-slate-900">Create New User</h2>
          <p className="mt-1 text-sm text-slate-500">Create account for Student Affairs Department Staff</p>
        </div>

        {/* Body cuộn */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
            )}

            <div className="flex flex-col gap-6">
              <div className="mb-4 w-full">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="example@email.com"
                />
              </div>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="username"
                    />
                  </div>

                  <div className="relative flex flex-col">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none ${
                          formData.password && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                            : 'border-slate-200 focus:border-blue-500'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-gray-700"
                      >
                        <img src={showPassword ? eyeIcon : eyeOffIcon} alt="Toggle" className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    formData.password &&
                    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)
                      ? '-mt-2 grid-rows-[1fr] opacity-100'
                      : 'mt-0 grid-rows-[0fr] opacity-0'
                  } origin-bottom`}
                >
                  <div className="overflow-hidden">
                    <p className="text-center text-xs text-red-500">
                      The password must be at least 8 characters long, including at least one uppercase letter and one
                      number, and one special character.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="relative w-full">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 top-6.25 right-0 flex h-10 w-10 items-center justify-center">
                  <img src={ChevronDown} alt="chevron-down" className="h-5 w-5" />
                </span>
              </div>

              <div className="relative w-full">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Campus <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.campus}
                  onChange={e => setFormData({ ...formData, campus: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Select Campus
                  </option>
                  <option value="HN">Ha Noi</option>
                  <option value="HCM">Ho Chi Minh</option>
                  <option value="DN">Da Nang</option>
                  <option value="CT">Can Tho</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 top-6.25 right-0 flex h-10 w-10 items-center justify-center">
                  <img src={ChevronDown} alt="chevron-down" className="h-5 w-5" />
                </span>
              </div>
            </div>

            {formData.role === 'staff' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Departments <span className="text-red-500">*</span>{' '}
                  <span className="text-xs font-normal text-slate-500">
                    (Select at least one. If no departments exist, please create one!)
                  </span>
                </label>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1">
                  {departments.map(dept => (
                    <label
                      key={dept.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.department_ids?.includes(dept.id) || false}
                        onChange={() => toggleDepartment(dept.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{dept.name}</span>
                    </label>
                  ))}
                  {departments.length === 0 && <div className="p-4 text-center text-sm text-slate-500">No data</div>}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer cố định */}
        <div className="border-t border-slate-100 px-8 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || isSubmitDisabled}
              className="rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default CreateUserDialog
