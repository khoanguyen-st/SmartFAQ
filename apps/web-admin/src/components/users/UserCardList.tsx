import React from 'react'
import type { User } from '@/types/users'
import type { UserCardListProps } from '@/interfaces/user-card-list'
import { UserActions } from './UserActions'
import { CSS_CLASSES } from '@/constants'

const getCampusLabel = (code: string) => {
  const map: Record<string, string> = {
    HN: 'Hanoi',
    HCM: 'Ho Chi Minh',
    DN: 'Danang',
    CT: 'Can Tho'
  }
  return map[code] || code
}

export const UserCardList: React.FC<UserCardListProps> = ({
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

  if (loading) {
    return <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
  }

  if (users.length === 0) {
    return <div className="p-4 text-center text-sm text-slate-500">No users found</div>
  }

  return (
    <div className="grid gap-4 md:hidden">
      {users.map(user => {
        const status = getStatusConfig(user)

        return (
          <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{user.username}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <span className={status.className}>{status.label}</span>
            </div>

            <div className="space-y-2.5 border-t border-slate-100 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-medium text-slate-900">{user.phone || '-'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="font-medium text-slate-900 capitalize">{user.role}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Campus:</span>
                <span className="font-medium text-slate-900">{getCampusLabel(user.campus)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
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
        )
      })}
    </div>
  )
}
