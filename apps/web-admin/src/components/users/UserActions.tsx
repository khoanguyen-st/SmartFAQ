import React from 'react'
import { Key, Lock, Unlock, Pencil } from 'lucide-react'
import type { User } from '../../../types/users'

interface UserActionsProps {
  user: User
  onEdit: (user: User) => void
  onLock: (userId: number) => void
  onUnlock: (userId: number) => void
  onResetPassword: (userId: number) => void
  variant?: 'desktop' | 'mobile'
}

export const UserActions: React.FC<UserActionsProps> = ({
  user,
  onEdit,
  onLock,
  onUnlock,
  onResetPassword,
  variant = 'desktop'
}) => {
  if (variant === 'mobile') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onEdit(user)}
          className="min-w-[80px] flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <Pencil className="mr-1 inline h-4 w-4" />
          Edit
        </button>
        {user.status === 'Active' ? (
          <button
            onClick={() => onLock(user.id)}
            className="min-w-[80px] flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <Lock className="mr-1 inline h-4 w-4" />
            Lock
          </button>
        ) : (
          <button
            onClick={() => onUnlock(user.id)}
            className="min-w-[80px] flex-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
          >
            <Unlock className="mr-1 inline h-4 w-4" />
            Unlock
          </button>
        )}
        <button
          onClick={() => onResetPassword(user.id)}
          className="min-w-[120px] flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
        >
          <Key className="mr-1 inline h-4 w-4" />
          Reset Password
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onEdit(user)}
        className="rounded-full border border-transparent p-2 text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50"
        aria-label="Edit user"
      >
        <Pencil className="h-4 w-4" />
      </button>
      {user.status === 'Active' ? (
        <button
          onClick={() => onLock(user.id)}
          className="rounded-full border border-transparent p-2 text-red-500 hover:border-red-100 hover:bg-red-50"
          aria-label="Lock user"
        >
          <Lock className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => onUnlock(user.id)}
          className="rounded-full border border-transparent p-2 text-orange-500 hover:border-orange-100 hover:bg-orange-50"
          aria-label="Unlock user"
        >
          <Unlock className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={() => onResetPassword(user.id)}
        className="rounded-full border border-transparent p-2 text-amber-500 hover:border-amber-100 hover:bg-amber-50"
        aria-label="Reset password"
      >
        <Key className="h-4 w-4" />
      </button>
    </div>
  )
}
