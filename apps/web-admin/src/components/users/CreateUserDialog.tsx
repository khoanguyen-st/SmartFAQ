import React, { useMemo, useState } from 'react'
import type { CreateUserDialogProps, CreateUserDialogPayload } from '@/interfaces/create-user-dialog'

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
    campus: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSubmitDisabled = useMemo(() => {
    return (
      !formData.email ||
      !formData.username ||
      !formData.password ||
      formData.password.length < 8 ||
      !formData.role ||
      !formData.campus
    )
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const isDuplicate = users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())

    if (isDuplicate) {
      setError('Username already exists')
      return
    }

    try {
      setLoading(true)
      await onSubmit?.(formData)
      onSuccess?.()
      onClose()
      setFormData({
        username: '',
        email: '',
        password: '',
        role: '',
        campus: ''
      })
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Create failed')
      console.error('Failed to create user:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:px-4">
      <div className="h-full w-full overflow-y-auto bg-white p-6 shadow-2xl sm:h-auto sm:max-w-xl sm:rounded-3xl sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Create New User</h2>
          <p className="mt-1 text-sm text-slate-500">Fill in the information to create a new user</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username *</label>
            <input
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="Username"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password *</label>
            <input
              required
              type="password"
              value={formData.password}
              minLength={8}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password (min 8 characters)"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role *</label>
            <select
              required
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                Select Role
              </option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Campus *</label>
            <select
              required
              value={formData.campus}
              onChange={e => setFormData({ ...formData, campus: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                Select Campus
              </option>
              <option value="HN">Hanoi</option>
              <option value="HCM">Ho Chi Minh</option>
              <option value="DN">Danang</option>
              <option value="CT">Can Tho</option>
            </select>
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
              disabled={loading || isSubmitDisabled}
              className="rounded-full bg-blue-800 px-8 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default CreateUserDialog
