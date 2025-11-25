import React from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@/types/users'
import type { UserCardListProps } from '@/interfaces/user-card-list'
import { UserActions } from './UserActions'
import { CSS_CLASSES } from '@/constants'

const getStatusText = (status: User['status'], t: (key: string) => string) => {
  return status === 'Locked' ? t('user.status.locked') : t('user.status.active')
}

const renderStatusBadge = (status: User['status']) => {
  if (status === 'Locked') return `${CSS_CLASSES.BADGE_BASE} ${CSS_CLASSES.BADGE_LOCKED}`
  return `${CSS_CLASSES.BADGE_BASE} ${CSS_CLASSES.BADGE_ACTIVE}`
}

export const UserCardList: React.FC<UserCardListProps> = ({
  users,
  loading,
  page,
  pageSize,
  onEdit,
  onLock,
  onUnlock,
  onResetPassword
}) => {
  const { t } = useTranslation()
  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-500">{t('common.loading')}</div>
  }

  if (users.length === 0) {
    return <div className="py-12 text-center text-sm text-slate-500">{t('user.noUsersFound')}</div>
  }

  return (
    <>
      {users.map((user, index) => (
        <div key={user.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-blue-700">#{(page - 1) * pageSize + index + 1}</div>
            <span className={renderStatusBadge(user.status)}>{getStatusText(user.status, t)}</span>
          </div>
          <div className="mb-3 space-y-2">
            <div className="text-base font-semibold text-slate-900">{user.username}</div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">{t('user.card.email')}</span> {user.email}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">{t('user.card.phone')}</span> {user.phoneNumber}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">{t('user.card.role')}</span> {user.role}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">{t('user.card.department')}</span>{' '}
              {user.departments && user.departments.length > 0 ? user.departments.join(', ') : '-'}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <UserActions
              user={user}
              onEdit={onEdit}
              onLock={onLock}
              onUnlock={onUnlock}
              onResetPassword={onResetPassword}
              variant="mobile"
            />
          </div>
        </div>
      ))}
    </>
  )
}
