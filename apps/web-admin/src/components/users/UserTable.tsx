import React from 'react'
import type { User } from '@/types/users'
import type { UserTableProps } from '@/interfaces/user-table'
import { UserActions } from './UserActions'
import { CSS_CLASSES } from '@/constants'

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onEdit,
  onLock,
  onUnlock,
  onResetPassword
}) => {

  const getStatusConfig = (user: User) => {
    if (user.failed_attempts >= 5) {
        return {
            label: 'Locked',
            className: `${CSS_CLASSES.BADGE_BASE} bg-red-100 text-red-800`
        }
    }
    if (user.is_locked) {
        return {
            label: 'Inactive',
            className: `${CSS_CLASSES.BADGE_BASE} bg-amber-100 text-amber-800`
        }
    }
    return {
        label: 'Active',
        className: `${CSS_CLASSES.BADGE_BASE} ${CSS_CLASSES.BADGE_ACTIVE}`
    }
  }

  const renderTableBody = () => {
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
        {users.map((user: User) => {
            const statusConfig = getStatusConfig(user);
            return (
                <tr key={user.id} className="border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
                    <td className="px-6 py-4 text-center whitespace-nowrap">{user.id}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="font-medium text-slate-900">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">{user.phone || '-'}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap capitalize">{user.role}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">{user.campus}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={statusConfig.className}>
                            {statusConfig.label}
                        </span>
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
            )
        })}
      </>
    )
  }

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th className="px-6 py-3 text-center whitespace-nowrap">ID</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">Username</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">Email</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">Phone</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">Role</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">Campus</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">Status</th>
            <th className="px-6 py-3 text-center whitespace-nowrap">Action</th>
          </tr>
        </thead>
        <tbody>{renderTableBody()}</tbody>
      </table>
    </div>
  )
}