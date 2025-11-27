import { useState, useCallback, useEffect } from 'react'
import { UserService } from '@/services/user.services'
import type { User, CreateUserRequest } from '@/types/users'

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await UserService.listUsers({ page, pageSize })
      setUsers(res.data)
      setTotalRecords(res.metadata?.total ?? res.data.length)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const createUser = useCallback(
    async (payload: CreateUserRequest) => {
      await UserService.createUser(payload)
      await loadUsers()
    },
    [loadUsers]
  )

  const updateUser = useCallback(
    async (userId: number, payload: Partial<User>) => {
      await UserService.updateUser(userId, payload)
      await loadUsers()
    },
    [loadUsers]
  )

  const lockUser = useCallback(
    async (userId: number) => {
      await UserService.lockUser(userId)
      await loadUsers()
    },
    [loadUsers]
  )

  const unlockUser = useCallback(
    async (userId: number) => {
      await UserService.unlockUser(userId)
      await loadUsers()
    },
    [loadUsers]
  )

  const resetPassword = useCallback(async (userId: number) => {
    await UserService.resetUserPassword(userId)
  }, [])

  return {
    users,
    loading,
    error,
    page,
    pageSize,
    totalRecords,
    setPage,
    setPageSize,
    createUser,
    updateUser,
    lockUser,
    unlockUser,
    resetPassword,
    refreshUsers: loadUsers
  }
}
