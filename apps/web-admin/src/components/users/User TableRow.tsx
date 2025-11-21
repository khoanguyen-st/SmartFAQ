import type { User } from '../../../types/users'
import { Lock, Unlock, Key, Pencil } from 'lucide-react'
import Button from '../ui/Button'

interface UserTableRowProps {
  user: User
  actionLoading: number | null
  onEdit: (user: User) => void
  onLock: (userId: number) => void
  onUnlock: (userId: number) => void
  onResetPassword: (userId: number) => void
}

export default function UserTableRow({
  user,
  actionLoading,
  onEdit,
  onLock,
  onUnlock,
  onResetPassword
}: UserTableRowProps) {
  const isLoading = actionLoading === user.id

  return (
    <tr className="border-b border-slate-200 transition-colors hover:bg-slate-50">
      <td className="px-3 py-3 text-xs font-medium text-slate-700 sm:px-6 sm:text-sm">{user.id}</td>
      <td className="px-3 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-blue-100 lg:flex">
            <span className="text-sm font-medium text-blue-700">{user.username.substring(0, 2).toUpperCase()}</span>
          </div>
          <span className="text-xs font-semibold text-slate-900 sm:text-sm">{user.username}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-[11px] text-slate-600 sm:px-6 sm:text-sm">{user.email}</td>
      <td className="px-3 py-3 text-[11px] text-slate-600 sm:px-6 sm:text-sm">{user.phoneNumber || 'N/A'}</td>
      <td className="px-3 py-3 sm:px-6">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${user.status === 'Locked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
        >
          {user.status}
        </span>
      </td>
      <td className="px-3 py-3 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(user)} disabled={isLoading} title="Edit user">
            <Pencil className="h-4 w-4" />
          </Button>
          {user.status !== 'Locked' ? (
            <Button size="sm" variant="ghost" onClick={() => onLock(user.id)} disabled={isLoading} title="Lock user">
              <Lock className="h-4 w-4 text-red-600" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUnlock(user.id)}
              disabled={isLoading}
              title="Unlock user"
            >
              <Unlock className="h-4 w-4 text-green-600" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onResetPassword(user.id)}
            disabled={isLoading}
            title="Reset password"
          >
            <Key className="h-4 w-4 text-blue-600" />
          </Button>
        </div>
      </td>
      <td className="hidden px-3 py-3 text-[11px] text-slate-600 sm:px-6 sm:text-sm xl:table-cell">{user.role}</td>
    </tr>
  )
}
