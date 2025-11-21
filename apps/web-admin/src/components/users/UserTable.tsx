import React from 'react'
import type { User } from '../../../types/users'
import { UserActions } from './UserActions'

const getStatusText = (status: User['status']) => {
  return status === 'Locked' ? 'Inactive' : 'Active'
}

const renderStatusBadge = (status: User['status']) => {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold'
  if (status === 'Locked') return `${base} bg-red-50 text-red-600`
  return `${base} bg-emerald-50 text-emerald-600`
}

interface UserTableProps {
  users: User[]
  loading: boolean
  page: number
  pageSize: number
  onEdit: (user: User) => void
  onLock: (userId: number) => void
  onUnlock: (userId: number) => void
  onResetPassword: (userId: number) => void
}

export const UserTableRows: React.FC<UserTableProps> = ({
  users,
  loading,
  page,
  pageSize,
  onEdit,
  onLock,
  onUnlock,
  onResetPassword
}) => {
  if (loading) {
    return (
      <tr>
        <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
          Loading...
        </td>
      </tr>
    )
  }

  if (users.length === 0) {
    return (
      <tr>
        <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
          No users found
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
          <td className="px-6 py-4 whitespace-nowrap">{user.department ?? '—'}</td>
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
