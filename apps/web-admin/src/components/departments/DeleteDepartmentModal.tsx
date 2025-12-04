import warningUrl from '@/assets/icons/warning.svg'

interface DeleteDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  departmentName: string
  isLoading?: boolean
}

const DeleteDepartmentModal = ({
  isOpen,
  onClose,
  onConfirm,
  departmentName,
  isLoading
}: DeleteDepartmentModalProps) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-8 shadow-2xl transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFECEC]">
            <img
              src={warningUrl}
              alt="warning"
              className="h-10 w-10"
              style={{
                filter: 'invert(16%) sepia(77%) saturate(6986%) hue-rotate(358deg) brightness(96%) contrast(114%)'
              }}
            />
          </div>

          <h2 className="mb-3 text-2xl font-bold text-gray-900">Delete Department?</h2>

          <p className="mb-8 text-base leading-relaxed text-gray-500">
            You are about to delete <span className="font-bold text-gray-900">"{departmentName}"</span>.
            <br />
            This action cannot be undone. Do you want to continue?
          </p>

          <div className="flex w-full gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="h-[50px] flex-1 rounded-full border border-gray-300 bg-white font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex h-[50px] flex-1 items-center justify-center rounded-full bg-[#C20B0B] font-medium text-white shadow-sm transition-colors hover:bg-[#a00909] disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete Department'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteDepartmentModal
