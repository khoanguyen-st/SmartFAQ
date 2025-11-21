import React, { useState, useEffect } from 'react'
import type { User } from '../../types/users'

interface Props {
  open: boolean
  user: User | null
  onClose: () => void
  onSubmit?: (id: number, data: Partial<User>) => Promise<void> | void
  onSuccess?: () => void
}

const CAMPUS_OPTIONS = ['Hà Nội Campus', 'Đà Nẵng Campus', 'Hồ Chí Minh Campus']
const DEPARTMENT_OPTIONS = ['Academic Affairs', 'Student Affairs', 'Information Technology']

export const EditUserDialog: React.FC<Props> = ({ open, user, onClose, onSubmit, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<User>>({})
  const [loading, setLoading] = useState(false)
  const [campusOpen, setCampusOpen] = useState(false)
  const [departmentOpen, setDepartmentOpen] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({ email: user.email, department: user.department, campus: user.campus })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      await onSubmit?.(user.id, formData)
      onSuccess?.()
      onClose()
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  if (!open || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:px-4">
      <div className="h-full w-full overflow-y-auto bg-white p-6 shadow-2xl sm:h-auto sm:max-w-xl sm:rounded-3xl sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Edit User Account</h2>
          <p className="mt-1 text-sm text-slate-500">Update email or department information.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
            <input
              required
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700">Campus</label>
            <button
              type="button"
              onClick={() => setCampusOpen(o => !o)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
              aria-haspopup="listbox"
              aria-expanded={campusOpen}
            >
              <span>{formData.campus || 'Choose campus'}</span>
              <span className="text-slate-400">▾</span>
            </button>
            {campusOpen && (
              <div className="absolute left-0 z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <ul className="space-y-3 text-sm" role="listbox">
                  {CAMPUS_OPTIONS.map(option => {
                    const checked = formData.campus === option
                    return (
                      <li key={option} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={checked}
                          onChange={() => setFormData({ ...formData, campus: checked ? '' : option })}
                        />
                        <label
                          onClick={() => setFormData({ ...formData, campus: checked ? '' : option })}
                          className="cursor-pointer text-slate-700 select-none"
                        >
                          {option}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
            <button
              type="button"
              onClick={() => setDepartmentOpen(o => !o)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
              aria-haspopup="listbox"
              aria-expanded={departmentOpen}
            >
              <span>{formData.department || 'Choose department'}</span>
              <span className="text-slate-400">▾</span>
            </button>
            {departmentOpen && (
              <div className="absolute left-0 z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <ul className="space-y-3 text-sm" role="listbox">
                  {DEPARTMENT_OPTIONS.map(option => {
                    const checked = formData.department === option
                    return (
                      <li key={option} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={checked}
                          onChange={() => setFormData({ ...formData, department: checked ? '' : option })}
                        />
                        <label
                          onClick={() => setFormData({ ...formData, department: checked ? '' : option })}
                          className="cursor-pointer text-slate-700 select-none"
                        >
                          {option}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-blue-800 px-8 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUserDialog
