import { useEffect, useState } from 'react'

interface CreateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description: string }) => Promise<void>
  isLoading?: boolean
}

const CreateDepartmentModal = ({ isOpen, onClose, onSubmit, isLoading }: CreateDepartmentModalProps) => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Department name is required')
      return
    }
    try {
      setError(null)
      await onSubmit({ name, description: '' })
      onClose()
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An error occurred')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative h-[420px] w-[710px] rounded-[20px] bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <h2 className="absolute top-[45px] left-[68px] font-sans text-[30px] leading-[38px] font-bold text-black">
            Create Department
          </h2>

          <p className="absolute top-[95px] left-[68px] font-sans text-[18px] leading-[26px] font-medium text-[#637381]">
            Create department for user account.
          </p>

          <div className="absolute top-[150px] left-[68px] flex flex-col items-start gap-[5px]">
            <label className="font-sans text-[16px] leading-6 font-medium text-[#111928]">
              Name <span className="text-[#F23030]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter name"
              className="h-[46px] w-[574px] rounded-md border border-[#6B7280] bg-white px-5 py-3 text-[16px] text-[#111928] placeholder-[#9CA3AF] focus:border-[#003087] focus:outline-none"
              autoFocus
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-[307px] left-[377px] flex h-[52px] w-[120px] items-center justify-center gap-2.5 rounded-[50px] border-2 border-[#F3F4F6] bg-white text-[16px] font-medium text-black hover:bg-gray-50 disabled:opacity-70"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="absolute top-[307px] left-[518px] flex h-[52px] w-[124px] items-center justify-center gap-2.5 rounded-[50px] bg-[#003087] text-[16px] font-medium text-white hover:bg-[#002569] disabled:opacity-70"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateDepartmentModal
