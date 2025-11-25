import warningUrl from '@/assets/icons/warning.svg'
import React from 'react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  documentTitle: string
  onCancel: () => void
  onConfirm: () => void
}
const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  documentTitle,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-red-100 p-3">
            <img src={warningUrl} alt="warning" className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Delete Document?</h2>
        </div>
        <div className="mb-8 text-center">
          <p className="text-gray-600">
            You are about to delete 1 document named: "{documentTitle}".
            <span className="mt-1 block font-semibold text-red-600">
              This action cannot be undone. Do you want to continue?
            </span>
          </p>
        </div>
        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-red-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-red-700"
          >
            Delete Document
          </button>
        </div>
      </div>
    </div>
  )
}
export default DeleteConfirmationModal
