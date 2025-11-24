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

interface UserCardListProps {
  users: User[]
  loading: boolean
  page: number
  pageSize: number
  onEdit: (user: User) => void
  onLock: (userId: number) => void
  onUnlock: (userId: number) => void
  onResetPassword: (userId: number) => void
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
  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading...</div>
  }

  if (users.length === 0) {
    return <div className="py-12 text-center text-sm text-slate-500">No users found</div>
  }

  return (
    <>
      {users.map((user, index) => (
        <div key={user.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-blue-700">#{(page - 1) * pageSize + index + 1}</div>
            <span className={renderStatusBadge(user.status)}>{getStatusText(user.status)}</span>
          </div>
          <div className="mb-3 space-y-2">
            <div className="text-base font-semibold text-slate-900">{user.username}</div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">Phone:</span> {user.phoneNumber}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">Role:</span> {user.role}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">Department:</span> {user.department ?? '—'}
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
