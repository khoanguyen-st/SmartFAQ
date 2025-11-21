import { useState, useEffect, useCallback } from 'react'
import { User, fetchUsers, lockUser, unlockUser, resetUserPassword } from '@/lib/api'

interface UseUsersOptions {
  autoLoad?: boolean
}

interface UseUsersReturn {
  users: User[]
  loading: boolean
  error: string | null
  actionLoading: number | null
  loadUsers: () => Promise<void>
  handleLockUser: (userId: number) => Promise<void>
  handleUnlockUser: (userId: number) => Promise<void>
  handleResetPassword: (userId: number) => Promise<void>
}

export function useUsers({ autoLoad = true }: UseUsersOptions = {}): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchUsers()
      setUsers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoLoad) {
      loadUsers()
    }
  }, [autoLoad, loadUsers])

  const handleLockUser = useCallback(
    async (userId: number) => {
      if (!confirm('Are you sure you want to lock this user account?')) return

      setActionLoading(userId)
      try {
        await lockUser(userId)
        await loadUsers()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to lock user'
        alert(message)
      } finally {
        setActionLoading(null)
      }
    },
    [loadUsers]
  )

  const handleUnlockUser = useCallback(
    async (userId: number) => {
      if (!confirm('Are you sure you want to unlock this user account?')) return

      setActionLoading(userId)
      try {
        await unlockUser(userId)
        await loadUsers()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to unlock user'
        alert(message)
      } finally {
        setActionLoading(null)
      }
    },
    [loadUsers]
  )

  const handleResetPassword = useCallback(async (userId: number) => {
    if (!confirm("Are you sure you want to reset this user's password? An email will be sent to the user.")) return

    setActionLoading(userId)
    try {
      const result = await resetUserPassword(userId)
      alert(result.message || 'Password reset email sent successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password'
      alert(message)
      throw err
    } finally {
      setActionLoading(null)
    }
  }, [])

  return {
    users,
    loading,
    error,
    actionLoading,
    loadUsers,
    handleLockUser,
    handleUnlockUser,
    handleResetPassword
  }
}
