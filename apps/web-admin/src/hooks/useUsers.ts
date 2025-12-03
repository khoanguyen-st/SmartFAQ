import { useState, useCallback, useEffect, useRef } from 'react'
import * as AdminService from '@/services/admin.services'
import { forgotPassword } from '@/lib/api'
import type { User, CreateUserRequest } from '@/types/users'

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalRecords, setTotalRecords] = useState(0)

  const loadingRef = useRef(false)

  const loadUsers = useCallback(async (isAutoRefresh = false) => {
    if (loadingRef.current) return

    if (!isAutoRefresh) {
      setLoading(true)
    }
    loadingRef.current = true

    try {
      const allUsers = await AdminService.fetchUsers()
      const sortedUsers = allUsers.sort((a, b) => a.id - b.id)
      setUsers(sortedUsers)
      setTotalRecords(allUsers.length)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      if (!isAutoRefresh) setError(message)
    } finally {
      if (!isAutoRefresh) {
        setLoading(false)
      }
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    loadUsers(false)
  }, [loadUsers])

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadUsers(true)
    }, 3000)

    return () => clearInterval(intervalId)
  }, [loadUsers])

  const createUser = useCallback(
    async (payload: CreateUserRequest & { password: string }) => {
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

  const resetPassword = useCallback(async (email: string) => {
    await forgotPassword(email)
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
    resetPassword
  }
}
