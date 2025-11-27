import type { UserActionsProps } from '@/interfaces/user-actions'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Unlock, Pencil } from 'lucide-react'

export const UserActions: React.FC<UserActionsProps> = ({
  user,
  onEdit,
  onLock,
  onUnlock,
  variant = 'desktop'
}) => {
  const { t } = useTranslation()
  if (variant === 'mobile') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onEdit(user)}
          className="min-w-[80px] flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <Pencil className="mr-1 inline h-4 w-4" />
          {t('common.edit')}
        </button>
        {!user.is_locked ? (
          <button
            onClick={() => onLock(user.id)}
            className="min-w-[80px] flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <Lock className="mr-1 inline h-4 w-4" />
            {t('user.lock')}
          </button>
        ) : (
          <button
            onClick={() => onUnlock(user.id)}
            className="min-w-[80px] flex-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
          >
            <Unlock className="mr-1 inline h-4 w-4" />
            {t('user.unlock')}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onEdit(user)}
        className="rounded-full border border-transparent p-2 text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50"
        aria-label={t('user.editUser')}
      >
        <Pencil className="h-4 w-4" />
      </button>
      {!user.is_locked ? (
        <button
          onClick={() => onLock(user.id)}
          className="rounded-full border border-transparent p-2 text-red-500 hover:border-red-100 hover:bg-red-50"
          aria-label={t('user.lockUser')}
        >
          <Lock className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => onUnlock(user.id)}
          className="rounded-full border border-transparent p-2 text-orange-500 hover:border-orange-100 hover:bg-orange-50"
          aria-label={t('user.unlockUser')}
        >
          <Unlock className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
