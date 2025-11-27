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
  }, [page, pageSize])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  type CreateUserFullRequest = CreateUserRequest & { password: string; campus_id: string }
  const createUser = useCallback(
    async (payload: CreateUserFullRequest) => {
      // Chỉ truyền các trường có giá trị, loại bỏ undefined/rỗng
      const cleanPayload: CreateUserFullRequest = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      ) as CreateUserFullRequest
      await AdminService.createUser(cleanPayload)
      await loadUsers()
    },
    [loadUsers]
  )

  const updateUser = useCallback(
    async (userId: number, payload: Partial<User>) => {
      await AdminService.updateUser(String(userId), payload)
      await loadUsers()
    },
    [loadUsers]
  )

  const lockUser = useCallback(
    async (userId: number) => {
      await AdminService.lockUser(String(userId))
      await loadUsers()
    },
    [loadUsers]
  )

  const unlockUser = useCallback(
    async (userId: number) => {
      await AdminService.unlockUser(String(userId))
      await loadUsers()
    },
    [loadUsers]
  )

  const resetPassword = useCallback(async (userId: number) => {
    await AdminService.resetUserPassword(String(userId))
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
