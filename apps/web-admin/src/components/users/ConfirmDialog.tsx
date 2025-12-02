import React from 'react'
import { Lock, Unlock, Key } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  type: 'lock' | 'unlock' | 'resetPassword'
  username?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  type,
  username,
  onConfirm,
  onCancel,
  loading = false
}) => {

  if (!open) return null

  const getDialogConfig = () => {
    switch (type) {
      case 'lock':
        return {
          icon: <Lock className="h-12 w-12 text-red-600" />,
          title: 'Set Inactive',
          description: 'Are you sure you want to set this user to Inactive? They will not be able to login.',
          confirmText: 'Inactive',
          confirmClass: 'bg-red-600 hover:bg-red-700'
        }
      case 'unlock':
        return {
          icon: <Unlock className="h-12 w-12 text-orange-600" />,
          title: 'Set Active',
          description: 'Are you sure you want to set this user to Active?',
          confirmText: 'Active',
          confirmClass: 'bg-orange-600 hover:bg-orange-700'
        }
      case 'resetPassword':
        return {
          icon: <Key className="h-12 w-12 text-amber-600" />,
          title: 'Reset Password',
          description: 'Password will be reset to default. Are you sure?',
          confirmText: 'Reset',
          confirmClass: 'bg-amber-600 hover:bg-amber-700'
        }
    }
  }

  const config = getDialogConfig()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex justify-center">{config.icon}</div>

        <h2 className="mb-2 text-center text-xl font-semibold text-slate-900">{config.title}</h2>

        {username && (
          <p className="mb-4 text-center text-sm text-slate-600">
            User: <span className="font-semibold text-slate-900">{username}</span>
          </p>
        )}

        <p className="mb-6 text-center text-sm text-slate-600">{config.description}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-full border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${config.confirmClass}`}
          >
            {loading ? 'Loading...' : config.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog