import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '../../../types/users'
import type { EditUserDialogProps } from '@/interfaces/edit-user-dialog'
import { validateDepartments } from '@/lib/validation'
import { getCampusOptions, getDepartmentOptions } from '@/constants/options'

export const EditUserDialog: React.FC<EditUserDialogProps> = ({ open, user, onClose, onSubmit, onSuccess }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<Partial<User>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campusOpen, setCampusOpen] = useState(false)
  const [departmentOpen, setDepartmentOpen] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({ email: user.email, departments: user.departments || [], campus: user.campus })
    }
  }, [user])

  const toggleDepartment = (dept: string) => {
    const current = formData.departments || []
    const updated = current.includes(dept) ? current.filter((d: string) => d !== dept) : [...current, dept]
    setFormData({ ...formData, departments: updated })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)

    const deptError = validateDepartments(formData.departments)
    if (deptError) {
      setError(deptError)
      return
    }

    setLoading(true)
    try {
      await onSubmit?.(user.id, formData)
      onSuccess?.()
      onClose()
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('user.error.updateFailed'))
      console.error('Failed to update user:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!open || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:px-4">
      <div className="h-full w-full overflow-y-auto bg-white p-6 shadow-2xl sm:h-auto sm:max-w-xl sm:rounded-3xl sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{t('user.dialog.editTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('user.dialog.editDescription')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('user.form.email')} *</label>
            <input
              required
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('user.form.campus')}</label>
            <button
              type="button"
              onClick={() => setCampusOpen(o => !o)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
              aria-haspopup="listbox"
              aria-expanded={campusOpen}
            >
              <span>
                {formData.campus
                  ? t(getCampusOptions().find(k => t(k) === formData.campus) || '')
                  : t('user.form.selectCampus')}
              </span>
              <span className="text-slate-400">▾</span>
            </button>
            {campusOpen && (
              <div className="absolute left-0 z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <ul className="space-y-3 text-sm" role="listbox">
                  {getCampusOptions().map(option => {
                    const translated = t(option)
                    const checked = formData.campus === translated
                    return (
                      <li key={option} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={checked}
                          onChange={() => setFormData({ ...formData, campus: checked ? '' : translated })}
                        />
                        <label
                          onClick={() => setFormData({ ...formData, campus: checked ? '' : translated })}
                          className="cursor-pointer text-slate-700 select-none"
                        >
                          {translated}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('user.form.department')}</label>
            <button
              type="button"
              onClick={() => setDepartmentOpen(o => !o)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
              aria-haspopup="listbox"
              aria-expanded={departmentOpen}
            >
              <span>
                {formData.departments && formData.departments.length > 0
                  ? formData.departments.join(', ')
                  : t('user.form.selectDepartment')}
              </span>
              <span className="text-slate-400">▾</span>
            </button>
            {departmentOpen && (
              <div className="absolute left-0 z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <ul className="space-y-3 text-sm" role="listbox">
                  {getDepartmentOptions().map(option => {
                    const translated = t(option)
                    const checked = formData.departments?.includes(translated) || false
                    return (
                      <li key={option} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={checked}
                          onChange={() => toggleDepartment(translated)}
                        />
                        <label
                          onClick={() => toggleDepartment(translated)}
                          className="cursor-pointer text-slate-700 select-none"
                        >
                          {translated}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-blue-800 px-8 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('common.update')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUserDialog
