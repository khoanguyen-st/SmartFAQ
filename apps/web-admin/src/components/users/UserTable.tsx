import React from 'react'
import type { User } from '../../../types/users'
import type { UserTableProps } from '@/interfaces/user-table'
import { UI_MESSAGES, USER_TABLE_HEADERS } from '@/constants/user'
import { UserActions } from './UserActions'

const getStatusText = (status: User['status']) => {
  return status === 'Locked' ? 'Inactive' : 'Active'
}

const renderStatusBadge = (status: User['status']) => {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold'
  if (status === 'Locked') return `${base} bg-red-50 text-red-600`
  return `${base} bg-emerald-50 text-emerald-600`
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  page,
  pageSize,
  onEdit,
  onLock,
  onUnlock,
  onResetPassword
}) => {
  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
            {UI_MESSAGES.LOADING}
          </td>
        </tr>
      )
    }

    if (users.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
            {UI_MESSAGES.NO_USERS_FOUND}
          </td>
        </tr>
      )
    }

    return (
      <>
        {users.map((user, index) => (
          <tr key={user.id} className="border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
            <td className="px-6 py-4 whitespace-nowrap">{(page - 1) * pageSize + index + 1}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="font-medium text-slate-900">{user.username}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
            <td className="px-6 py-4 text-center whitespace-nowrap">{user.phoneNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              {user.departments && user.departments.length > 0 ? user.departments.join(', ') : '—'}
            </td>
            <td className="px-6 py-4 text-center whitespace-nowrap">
              <span className={renderStatusBadge(user.status)}>{getStatusText(user.status)}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <UserActions
                user={user}
                onEdit={onEdit}
                onLock={onLock}
                onUnlock={onUnlock}
                onResetPassword={onResetPassword}
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
            <th className="px-6 py-3 text-left whitespace-nowrap">{USER_TABLE_HEADERS.ID}</th>
            <th className="px-6 py-3 text-left whitespace-nowrap">{USER_TABLE_HEADERS.USERNAME}</th>
            <th className="px-6 py-3 text-left whitespace-nowrap">{USER_TABLE_HEADERS.EMAIL}</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">{USER_TABLE_HEADERS.PHONE_NUMBER}</th>
            <th className="px-6 py-3 text-left whitespace-nowrap">{USER_TABLE_HEADERS.ROLE}</th>
            <th className="px-6 py-3 text-left whitespace-nowrap">{USER_TABLE_HEADERS.DEPARTMENT}</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">{USER_TABLE_HEADERS.STATUS}</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">{USER_TABLE_HEADERS.ACTION}</th>
          </tr>
        </thead>
        <tbody>{renderTableBody()}</tbody>
      </table>
    </div>
  )
}
