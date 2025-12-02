import React, { useState, useEffect } from 'react'
import type { User } from '@/types/users'
import type { EditUserDialogProps } from '@/interfaces/edit-user-dialog'
import { validateDepartments } from '@/lib/validation'
import { getDepartmentOptions } from '@/constants/options'

const CAMPUS_OPTIONS = [
  { label: 'Hanoi', value: 'HN' },
  { label: 'Ho Chi Minh', value: 'HCM' },
  { label: 'Danang', value: 'DN' },
  { label: 'Can Tho', value: 'CT' }
]

export const EditUserDialog: React.FC<EditUserDialogProps> = ({ 
  open, 
  user, 
  onClose, 
  onSubmit, 
  onSuccess,
  users = [] 
}) => {
  const [formData, setFormData] = useState<Partial<User>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campusOpen, setCampusOpen] = useState(false)
  const [departmentOpen, setDepartmentOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setFormData({})
      setError(null)
      setCampusOpen(false)
      setDepartmentOpen(false)
    }
  }, [open, user])

  const currentCampus = formData.campus !== undefined ? formData.campus : (user?.campus || '')
  const currentDepartments = formData.departments !== undefined ? formData.departments : (user?.departments || [])

  const getCampusLabel = (value: string) => {
    const option = CAMPUS_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : value
  }

  const toggleDepartment = (dept: string) => {
    const current = formData.departments !== undefined ? formData.departments : (user?.departments || [])
    const updated = current.includes(dept) 
      ? current.filter((d: string) => d !== dept) 
      : [...current, dept]
    setFormData(prev => ({ ...prev, departments: updated }))
  }

  const handleSelectCampus = (value: string) => {
    if (currentCampus === value) {
        setFormData(prev => ({ ...prev, campus: '' }))
    } else {
        setFormData(prev => ({ ...prev, campus: value }))
    }
    setCampusOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)

    if (formData.username && formData.username !== user.username) {
        const isDuplicate = users.some(u => 
            u.username.toLowerCase() === formData.username?.toLowerCase() && 
            u.id !== user.id 
        )

        if (isDuplicate) {
            setError('Username already exists')
            return
        }
    }

    if (formData.departments) {
      const deptError = validateDepartments(formData.departments)
      if (deptError) {
        setError(deptError)
        return
      }
    }

    setLoading(true)
    try {
      await onSubmit?.(user.id, formData)
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:px-4">
      <div className="h-full w-full overflow-y-auto bg-white p-6 shadow-2xl sm:h-auto sm:max-w-xl sm:rounded-3xl sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Edit User</h2>
          <p className="mt-1 text-sm text-slate-500">Update user information</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}
          
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username *</label>
            <input
              required
              type="text"
              value={formData.username !== undefined ? formData.username : user.username}
              onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700">Campus</label>
            <button
              type="button"
              onClick={() => setCampusOpen(prev => !prev)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <span className={!currentCampus ? 'text-slate-400' : 'text-slate-900'}>
                {currentCampus 
                    ? getCampusLabel(currentCampus) 
                    : 'Select Campus'
                }
              </span>
              <span className="text-slate-400">▾</span>
            </button>
            
            {campusOpen && (
              <div className="absolute left-0 z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <ul className="space-y-3 text-sm">
                  {CAMPUS_OPTIONS.map((option) => {
                    const isChecked = currentCampus === option.value
                    return (
                      <li key={option.value} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={isChecked}
                          onChange={() => handleSelectCampus(option.value)}
                        />
                        <label
                          onClick={() => handleSelectCampus(option.value)}
                          className="cursor-pointer text-slate-700 select-none flex-1"
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

          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
            <button
              type="button"
              onClick={() => setDepartmentOpen(prev => !prev)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <span className={currentDepartments.length === 0 ? 'text-slate-400' : 'text-slate-900'}>
                {currentDepartments.length > 0
                  ? currentDepartments.join(', ')
                  : 'Select Department'}
              </span>
              <span className="text-slate-400">▾</span>
            </button>
            
            {departmentOpen && (
              <div className="absolute left-0 z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <ul className="space-y-3 text-sm">
                  {getDepartmentOptions().map((optionKey) => {
                    const label = optionKey.replace('department.', '').toUpperCase()
                    const isChecked = currentDepartments.includes(optionKey)
                    
                    return (
                      <li key={optionKey} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={isChecked}
                          onChange={() => toggleDepartment(optionKey)}
                        />
                        <label
                          onClick={() => toggleDepartment(optionKey)}
                          className="cursor-pointer text-slate-700 select-none flex-1"
                        >
                          {label}
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
              {loading ? 'Loading...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUserDialog