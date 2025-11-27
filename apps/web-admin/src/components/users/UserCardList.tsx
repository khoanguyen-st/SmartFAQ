import React from 'react'
import { useTranslation } from 'react-i18next'
import type { UserCardListProps } from '@/interfaces/user-card-list'
import { UserActions } from './UserActions'
import { CSS_CLASSES } from '@/constants'

export const UserCardList: React.FC<UserCardListProps> = ({ users, loading, onEdit, onLock, onUnlock }) => {
  const { t } = useTranslation()
  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-500">{t('common.loading')}</div>
  }

  if (users.length === 0) {
    return <div className="py-12 text-center text-sm text-slate-500">{t('user.noUsersFound')}</div>
  }

  return (
    <>
      {users.map(user => (
        <div key={user.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-blue-700">#{user.id}</div>
            <span
              className={
                user.is_locked
                  ? `${CSS_CLASSES.BADGE_BASE} ${CSS_CLASSES.BADGE_LOCKED}`
                  : `${CSS_CLASSES.BADGE_BASE} ${CSS_CLASSES.BADGE_ACTIVE}`
              }
            >
              {user.is_locked ? t('user.status.locked') : t('user.status.active')}
            </span>
          </div>
          <div className="mb-3 space-y-2">
            <div className="text-base font-semibold text-slate-900">{user.username}</div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">{t('user.card.email')}</span> {user.email}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">{t('user.card.phone')}</span> {user.phone || '-'}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">{t('user.card.role')}</span> {user.role}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">{t('user.card.campus')}</span> {user.campus}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <UserActions user={user} onEdit={onEdit} onLock={onLock} onUnlock={onUnlock} variant="mobile" />
          </div>
        </div>
      ))}
    </>
  )
}
