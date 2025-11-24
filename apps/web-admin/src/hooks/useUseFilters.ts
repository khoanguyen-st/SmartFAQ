import { useMemo, useEffect } from 'react'
import type { User } from '../../types/users'

interface UseUserFiltersProps {
  users: User[]
  searchQuery: string
  selectedDepartments: string[]
  selectedStatuses: User['status'][]
}

export const useUserFilters = ({ users, searchQuery, selectedDepartments, selectedStatuses }: UseUserFiltersProps) => {
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchQuery
        ? user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        : true

      const matchesDepartment = selectedDepartments.length
        ? user.departments?.some(dept => selectedDepartments.includes(dept))
        : true

      const matchesStatus = selectedStatuses.length ? selectedStatuses.includes(user.status) : true

      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [users, searchQuery, selectedDepartments, selectedStatuses])

  return filteredUsers
}

interface UsePaginationProps<T> {
  items: T[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

export const usePagination = <T>({ items, page, pageSize, onPageChange }: UsePaginationProps<T>) => {
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return items.slice(startIndex, startIndex + pageSize)
  }, [items, page, pageSize])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      onPageChange(totalPages)
    }
  }, [page, totalPages, onPageChange])

  return {
    paginatedItems,
    totalPages
  }
}
