import React, { useMemo, useState, useEffect } from 'react'
import type { CreateUserDialogProps, CreateUserDialogPayload } from '@/interfaces/create-user-dialog'
import { fetchDepartments, type IDepartment } from '@/services/department.services'

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

  const isSubmitDisabled = useMemo(() => {
    const baseValidation =
      !formData.email ||
      !formData.username ||
      !formData.password ||
      formData.password.length < 8 ||
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

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="col-span-1 sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Username *</label>
                <input
                  required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password *</label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  minLength={8}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Campus *</label>
                <select
                  required
                  value={formData.campus}
                  onChange={e => setFormData({ ...formData, campus: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Select Campus
                  </option>
                  <option value="HN">Hà Nội</option>
                  <option value="HCM">Hồ Chí Minh</option>
                  <option value="DN">Đà Nẵng</option>
                  <option value="CT">Cần Thơ</option>
                </select>
              </div>
            </div>

            {formData.role === 'staff' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Departments *{' '}
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

            {/* THAY ĐỔI QUAN TRỌNG:
               pb-32: Thêm khoảng trống lớn (padding bottom) ở cuối form.
               Điều này đảm bảo khi mở dropdown Campus hoặc cuộn xuống cuối,
               giao diện không bị sát đáy, có chỗ chứa cho các option hiển thị thoáng hơn.
            */}
            <div className="pb-32"></div>
          </form>
        </div>

        {/* Footer cố định */}
        <div className="flex-none border-t border-slate-100 bg-gray-50 px-8 py-4">
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
