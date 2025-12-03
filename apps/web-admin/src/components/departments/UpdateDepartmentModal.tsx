import { useEffect, useState } from 'react'
import { IDepartment } from '@/services/department.services'

interface UpdateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string }) => Promise<void>
  initialData: IDepartment | null
  isLoading?: boolean
}

const UpdateDepartmentModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: UpdateDepartmentModalProps) => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || '')
      setError(null)
    }
  }, [isOpen, initialData])

  if (!isOpen || !initialData) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Department name is required')
      return
    }

    if (trimmedName === initialData.name) {
      onClose()
      return
    }

    try {
      setError(null)
      // Giữ nguyên description nếu có
      await onSubmit({ name: trimmedName })
      onClose()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message) // Hiển thị lỗi từ backend
      } else {
        setError('An error occurred')
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-8 pt-8 pb-4">
            <h2 className="font-sans text-3xl font-bold text-gray-900">Update Department</h2>
            <p className="mt-2 font-sans text-lg text-gray-500">Update department details.</p>
          </div>

          <div className="px-8 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-base font-medium text-gray-900">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Enter department name..."
                className={`h-12 w-full rounded-lg border bg-white px-4 text-base transition-all outline-none placeholder:text-gray-400 focus:ring-2 ${
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-[#003087] focus:ring-[#003087]/20'
                }`}
                autoFocus
              />
              {error && (
                <div className="mt-2 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 bg-gray-50 px-8 py-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-[50px] min-w-[120px] rounded-full border border-gray-300 bg-white px-6 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-[50px] min-w-[120px] items-center justify-center rounded-full bg-[#003087] px-6 font-medium text-white shadow-sm transition-colors hover:bg-[#002569] disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateDepartmentModal
