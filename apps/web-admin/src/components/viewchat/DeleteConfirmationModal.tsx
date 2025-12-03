import warningUrl from '@/assets/icons/warning.svg'
import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

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
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-red-100 p-3">
            <img src={warningUrl} alt="warning" className="h-6 w-6" />
          </div>
          <h2 id="delete-modal-title" className="text-xl font-semibold text-gray-800">
            Delete Document?
          </h2>
        </div>

        <div className="mb-8 text-center">
          <p className="text-gray-600">
            You are about to delete 1 document named:{' '}
            <span className="font-medium text-gray-900">"{documentTitle}"</span>.
            <span className="mt-2 block font-semibold text-red-600">
              This action cannot be undone. Do you want to continue?
            </span>
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="basis-1/2 cursor-pointer rounded-2xl border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="basis-1/2 cursor-pointer rounded-2xl bg-red-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default DeleteConfirmationModal
