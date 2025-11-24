import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '../lib/apt.client'
import type { User, CreateUserRequest } from '../../types/users'

const normalizeUser = (user: User): User => {
  const normalizedStatus = String(user.status).toLowerCase() === 'locked' ? 'Locked' : 'Active'
  return { ...user, status: normalizedStatus as User['status'] }
}

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
      const res = await apiClient.listUsers({ page, pageSize })
      const normalized = res.data.map(normalizeUser)
      setUsers(normalized)
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
      await apiClient.createUser(payload)
      await loadUsers()
    },
    [loadUsers]
  )

  const updateUser = useCallback(
    async (userId: number, payload: Partial<User>) => {
      await apiClient.updateUser(userId, payload)
      await loadUsers()
    },
    [loadUsers]
  )

  const lockUser = useCallback(
    async (userId: number) => {
      await apiClient.lockUser(userId)
      await loadUsers()
    },
    [loadUsers]
  )

  const unlockUser = useCallback(
    async (userId: number) => {
      await apiClient.unlockUser(userId)
      await loadUsers()
    },
    [loadUsers]
  )

  const resetPassword = useCallback(async (userId: number) => {
    await apiClient.resetUserPassword(userId)
    alert('Password reset email sent successfully')
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
