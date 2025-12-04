import React from 'react'
import WarningIcon from '@/assets/icons/warning.svg?react'
import CloseIcon from '@/assets/icons/close-x.svg?react'


const CONFIRM_MODAL = {
  TITLE: 'Delete this chat?',
  MESSAGE: 'This will delete all current chat history and cannot be recovered.',
  BUTTON_CANCEL: 'Cancel',
  BUTTON_CONFIRM: 'Delete'
}
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = CONFIRM_MODAL.TITLE,
  message = CONFIRM_MODAL.MESSAGE
}) => {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/5 backdrop-blur-sm transition-all duration-300">
      <div className="relative flex w-full max-w-[420px] scale-100 transform flex-col rounded-2xl bg-white p-6 shadow-2xl transition-all">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-white p-1 hover:bg-gray-100 focus:outline-none"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          <WarningIcon className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>

        <p className="my-2 text-sm text-gray-500">{message}</p>

        <div className="flex gap-3 self-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            {CONFIRM_MODAL.BUTTON_CANCEL}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
          >
            {CONFIRM_MODAL.BUTTON_CONFIRM}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
