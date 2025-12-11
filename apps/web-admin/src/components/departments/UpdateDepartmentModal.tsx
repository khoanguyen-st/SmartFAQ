import { useEffect, useState } from 'react'
import type { IDepartment, IUserInDepartment } from '@/services/department.services'

interface UpdateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; user_ids: number[] }) => Promise<void>
  initialData: IDepartment | null
  isLoading?: boolean
  availableUsers: IUserInDepartment[]
}

const UpdateDepartmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  availableUsers
}: UpdateDepartmentModalProps) => {
  const [name, setName] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || '')
      setSelectedUserIds(initialData.users?.map(u => u.id) || [])
      setError(null)
    }
  }, [isOpen, initialData])

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => (prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]))
  }

  if (!isOpen || !initialData) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Department name is required')
      return
    }

    if (
      trimmedName === initialData.name &&
      JSON.stringify(selectedUserIds.sort()) === JSON.stringify(initialData.users.map(u => u.id).sort())
    ) {
      onClose()
      return
    }

    try {
      setError(null)
      await onSubmit({ name: trimmedName, user_ids: selectedUserIds })
      onClose()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
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

            {/* User Selection */}
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-base font-medium text-gray-900">Assign Users (Optional)</label>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-300 bg-white">
                {availableUsers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No users available</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {availableUsers.map(user => (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#003087] focus:ring-[#003087]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 uppercase">
                          {user.role}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedUserIds.length > 0 && (
                <p className="mt-1 text-sm text-gray-600">
                  {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                </p>
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
