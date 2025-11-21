import { User } from '@/lib/api'
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
      <td className="px-6 py-4 text-sm text-slate-900">{user.id}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-medium text-blue-700">{user.username.substring(0, 2).toUpperCase()}</span>
          </div>
          <span className="text-sm font-medium text-slate-900">{user.username}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{user.phoneNumber || 'N/A'}</td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(user)} disabled={isLoading} title="Edit user">
            <Pencil className="h-4 w-4" />
          </Button>

          {user.status === 'Active' ? (
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
    </tr>
  )
}
