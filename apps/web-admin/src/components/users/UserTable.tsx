import React from 'react'
import type { User } from '@/types/users'
import type { UserTableProps } from '@/interfaces/user-table'
import { UserActions } from './UserActions'
import { CSS_CLASSES } from '@/constants'

export const UserTable: React.FC<UserTableProps> = ({ users, loading, onEdit, onLock, onUnlock, onResetPassword }) => {
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
          <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500">
            Loading...
          </td>
        </tr>
      )
    }

    if (users.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500">
            No users found
          </td>
        </tr>
      )
    }

    return (
      <>
        {users.map((user: User) => {
          const statusConfig = getStatusConfig(user)
          return (
            <tr
              key={user.id}
              className="border-b border-[#EEEEEE] text-sm text-slate-700 transition-colors last:border-0 hover:bg-slate-50"
              style={{ height: '60px' }}
            >
              <td className="px-6 py-3 text-center whitespace-nowrap">{user.id}</td>
              <td className="px-6 py-3 text-center whitespace-nowrap">
                <div className="font-medium text-slate-900">{user.username}</div>
              </td>
              <td className="px-6 py-3 text-center whitespace-nowrap">{user.email}</td>
              <td className="px-6 py-3 text-center whitespace-nowrap">{user.phone || '-'}</td>
              <td className="px-6 py-3 text-center whitespace-nowrap capitalize">{user.role}</td>
              <td className="px-6 py-3 text-center whitespace-nowrap">{user.campus}</td>
              <td className="px-6 py-3 text-center whitespace-nowrap">
                {user.departments && user.departments.length > 0 ? user.departments.map(d => d.name).join(', ') : '-'}
              </td>

              <td className="px-6 py-3 text-center whitespace-nowrap">
                <span className={statusConfig.className}>{statusConfig.label}</span>
              </td>
              <td className="px-6 py-3 whitespace-nowrap">
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
    <div className="hidden max-h-[360px] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-white text-xs text-black uppercase shadow-sm">
          <tr style={{ height: '60px' }}>
            <th className="px-6 py-3 text-center font-bold whitespace-nowrap">ID</th>
            <th className="px-6 py-3 text-center font-bold whitespace-nowrap">Username</th>
            <th className="px-6 py-3 text-center font-bold whitespace-nowrap">Email</th>
            <th className="px-6 py-3 text-center font-bold whitespace-nowrap">Phone Number</th>
            <th className="px-6 py-3 text-center font-bold whitespace-nowrap">Role</th>
            <th className="px-6 py-3 text-center font-bold whitespace-nowrap">Campus</th>
            <th className="px-6 py-3 text-center font-bold whitespace-nowrap">Department</th>
            <th className="px-6 py-3 text-center font-bold whitespace-nowrap">Status</th>
            <th className="px-6 py-3 text-center font-bold whitespace-nowrap">Action</th>
          </tr>
        </thead>
        <tbody>{renderTableBody()}</tbody>
      </table>
    </div>
  )
}
