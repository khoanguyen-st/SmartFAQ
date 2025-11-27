import { useState, useCallback, useEffect } from 'react'
import * as AdminService from '@/services/admin.services'
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
      const allUsers = await AdminService.fetchUsers()
      setUsers(allUsers)
      setTotalRecords(allUsers.length)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const createUser = useCallback(
    async (payload: CreateUserRequest & { password: string }) => {
      // Chỉ truyền các trường có giá trị, loại bỏ undefined/rỗng
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      ) as CreateUserRequest & { password: string }
      await AdminService.createUser(cleanPayload)
      await loadUsers()
    },
    [loadUsers]
  )

  const updateUser = useCallback(
    async (userId: number, payload: Partial<User>) => {
      await AdminService.updateUser(userId, payload)
      await loadUsers()
    },
    [loadUsers]
  )

  const lockUser = useCallback(
    async (userId: number) => {
      await AdminService.lockUser(userId)
      await loadUsers()
    },
    [loadUsers]
  )

  const unlockUser = useCallback(
    async (userId: number) => {
      await AdminService.unlockUser(userId)
      await loadUsers()
    },
    [loadUsers]
  )

  // API không hỗ trợ reset password
  const resetPassword = useCallback(async (_userId: number) => {
    throw new Error('Not supported')
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
