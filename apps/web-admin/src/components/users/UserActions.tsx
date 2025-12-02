import React from 'react'
import type { UserActionsProps } from '@/interfaces/user-actions'
import KeyIcon from '@/assets/keyIcon.svg'
import EditIcon from '@/assets/icons/lucide_edit.svg'
import LockIcon from '@/assets/icons/lockicon.svg'

export const UserActions: React.FC<UserActionsProps> = ({
  user,
  onEdit,
  onLock,
  onUnlock,
  onResetPassword,
  variant = 'desktop'
}) => {

  const renderEditButton = () => (
    <button
      onClick={() => onEdit?.(user)}
      className="rounded-full p-2 transition-colors hover:bg-slate-100"
      title="Edit"
    >
      <img src={EditIcon} alt="Edit" className="h-5 w-5" />
    </button>
  )

  const renderLockButton = () => {
    if (user.is_locked) {
      return (
        <button
          onClick={() => onUnlock?.(user.id)}
          className="rounded-full p-2 transition-colors hover:bg-slate-100"
          title="Unlock User"
        >
          <img src={LockIcon} alt="Unlock" className="h-5 w-5 opacity-50" />
        </button>
      )
    }
    return (
      <button
        onClick={() => onLock?.(user.id)}
        className="rounded-full p-2 transition-colors hover:bg-slate-100"
        title="Lock User"
      >
        <img src={LockIcon} alt="Lock" className="h-5 w-5" />
      </button>
    )
  }

  const renderResetPasswordButton = () => (
    <button
      onClick={() => onResetPassword?.(user)}
      className="rounded-full p-2 transition-colors hover:bg-slate-100"
      title="Reset Password"
    >
      <img src={KeyIcon} alt="Reset Password" className="h-5 w-5" />
    </button>
  )

  if (variant === 'mobile') {
    return (
      <div className="flex items-center gap-1">
        {renderEditButton()}
        {renderLockButton()}
        {renderResetPasswordButton()}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {renderEditButton()}
      {renderLockButton()}
      {renderResetPasswordButton()}
    </div>
  )
}