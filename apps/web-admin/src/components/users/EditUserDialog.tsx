import React, { useState, useEffect } from 'react'
import type { User, Department } from '@/types/users'
import type { EditUserDialogProps } from '@/interfaces/edit-user-dialog'
import { fetchDepartments } from '@/services/department.services'

const CAMPUS_OPTIONS = [
  { label: 'Hà Nội', value: 'HN' },
  { label: 'Hồ Chí Minh', value: 'HCM' },
  { label: 'Đà Nẵng', value: 'DN' },
  { label: 'Cần Thơ', value: 'CT' }
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
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([])
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([])

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await fetchDepartments()
        const mappedDepts: Department[] = Array.isArray(data) ? data : (data as { items: Department[] }).items || []

        setAvailableDepartments(mappedDepts)
      } catch (err) {
        console.error('Failed to load departments', err)
      }
    }
    loadDepartments()
  }, [])

  // --- THAY ĐỔI 1: Khi mở Dialog, luôn reset danh sách chọn về Rỗng ---
  useEffect(() => {
    if (open && user) {
      setFormData({})
      setError(null)
      setCampusOpen(false)
      setDepartmentOpen(false)

      // KHÔNG load department cũ vào state nữa
      // Để mảng rỗng để UI hiện "Choose Department"
      setSelectedDepartmentIds([])
    }
  }, [open, user])

  const currentCampus = formData.campus !== undefined ? formData.campus : user?.campus || ''

  const getCampusLabel = (value: string) => {
    const option = CAMPUS_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : value
  }

  const getSelectedDepartmentsLabel = () => {
    // Vì khởi tạo là [], nên nó sẽ luôn hiện dòng này lúc đầu
    if (selectedDepartmentIds.length === 0) return 'Choose Department'
    return availableDepartments
      .filter(d => selectedDepartmentIds.includes(d.id))
      .map(d => d.name)
      .join(', ')
  }

  const toggleDepartment = (deptId: number) => {
    setSelectedDepartmentIds(prev => {
      if (prev.includes(deptId)) {
        return prev.filter(id => id !== deptId)
      }
      return [...prev, deptId]
    })
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
      const isDuplicate = users.some(
        u => u.username.toLowerCase() === formData.username?.toLowerCase() && u.id !== user.id
      )

      if (isDuplicate) {
        setError('Username already exists')
        return
      }
    }

    setLoading(true)
    try {
      const submitData: Partial<User> & { department_ids?: number[] } = {
        ...formData
      }

      // --- THAY ĐỔI 2: Logic xử lý khi Submit ---
      // Nếu user CÓ chọn department mới (length > 0) -> Gửi danh sách đó lên để cập nhật.
      // Nếu user KHÔNG chọn gì (length == 0) -> KHÔNG gửi field department_ids -> Backend giữ nguyên cái cũ.
      if (selectedDepartmentIds.length > 0) {
        submitData.department_ids = selectedDepartmentIds
      }

      await onSubmit?.(user.id, submitData as unknown as Partial<User>)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-w-xl">
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Edit User</h2>
          <p className="mt-1 text-sm text-slate-500">Update user information</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2 pb-32 sm:px-8">
          <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
            )}

            {/* Username Field */}
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

            {/* Campus Select */}
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-slate-700">Campus</label>
              <button
                type="button"
                onClick={() => setCampusOpen(prev => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <span className={!currentCampus ? 'text-slate-400' : 'text-slate-900'}>
                  {currentCampus ? getCampusLabel(currentCampus) : 'Select Campus'}
                </span>
                <span className="text-slate-400">▾</span>
              </button>

              {campusOpen && (
                <div className="absolute left-0 z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <ul className="space-y-3 text-sm">
                    {CAMPUS_OPTIONS.map(option => {
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

            {/* Department Select */}
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
              <button
                type="button"
                onClick={() => setDepartmentOpen(prev => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <span className={selectedDepartmentIds.length === 0 ? 'text-slate-400' : 'text-slate-900'}>
                  {getSelectedDepartmentsLabel()}
                </span>
                <span className="text-slate-400">▾</span>
              </button>

              {departmentOpen && (
                <div className="absolute left-0 z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  {availableDepartments.length > 0 ? (
                    <ul className="max-h-48 space-y-3 overflow-y-auto text-sm">
                      {availableDepartments.map(dept => {
                        const isChecked = selectedDepartmentIds.includes(dept.id)
                        return (
                          <li key={dept.id} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                              checked={isChecked}
                              onChange={() => toggleDepartment(dept.id)}
                            />
                            <label
                              onClick={() => toggleDepartment(dept.id)}
                              className="flex-1 cursor-pointer text-slate-700 select-none"
                            >
                              {dept.name}
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="text-center text-xs text-slate-400 italic">No departments available</p>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="border-t border-slate-100 bg-white px-6 py-4 sm:px-8">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              form="edit-user-form"
              type="submit"
              disabled={loading}
              className="rounded-full bg-blue-800 px-8 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditUserDialog
