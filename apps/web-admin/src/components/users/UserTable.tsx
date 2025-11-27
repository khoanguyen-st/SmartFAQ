import React from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@/types/users'
import type { UserTableProps } from '@/interfaces/user-table'
import { UserActions } from './UserActions'
import { CSS_CLASSES } from '@/constants'

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onEdit,
  onLock,
  onUnlock
}) => {
  const { t } = useTranslation()
  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
            {t('common.loading')}
          </td>
        </tr>
      )
    }

    if (users.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
            {t('user.noUsersFound')}
          </td>
        </tr>
      )
    }

    return (
      <>
        {users.map((user: User) => (
          <tr key={user.id} className="border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
            <td className="px-6 py-4 text-center whitespace-nowrap">{user.id}</td>
            <td className="px-6 py-4 text-center whitespace-nowrap">
              <div className="font-medium text-slate-900">{user.username}</div>
            </td>
            <td className="px-6 py-4 text-center whitespace-nowrap">{user.email}</td>
            <td className="px-6 py-4 text-center whitespace-nowrap">{user.phone || '-'}</td>
            <td className="px-6 py-4 text-center whitespace-nowrap">{user.role}</td>
            <td className="px-6 py-4 text-center whitespace-nowrap">{user.campus}</td>
            <td className="px-6 py-4 text-center whitespace-nowrap">
              <span className={user.is_locked ? `${CSS_CLASSES.BADGE_BASE} ${CSS_CLASSES.BADGE_LOCKED}` : `${CSS_CLASSES.BADGE_BASE} ${CSS_CLASSES.BADGE_ACTIVE}`}> 
                {user.is_locked ? t('user.status.locked') : t('user.status.active')}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <UserActions
                user={user}
                onEdit={onEdit}
                onLock={onLock}
                onUnlock={onUnlock}
                variant="desktop"
              />
            </td>
          </tr>
        ))}
      </>
    )
  }

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th className="px-6 py-3 text-center whitespace-nowrap">{t('user.table.id')}</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">{t('user.table.username')}</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">{t('user.table.email')}</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">{t('user.table.phone')}</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">{t('user.table.role')}</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">{t('user.table.campus')}</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">{t('user.table.status')}</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">{t('user.table.action')}</th>
          </tr>
        </thead>
        <tbody>{renderTableBody()}</tbody>
      </table>
    </div>
  )
}
