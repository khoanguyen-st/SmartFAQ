import { useMemo } from 'react'
import { User } from '@/lib/api'

interface UseUserFiltersProps {
  users: User[]
  searchQuery: string
  statusFilter: string
}

export function useUserFilters({ users, searchQuery, statusFilter }: UseUserFiltersProps) {
  return useMemo(() => {
    let result = [...users]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        user => user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter)
    }

    return result
  }, [users, searchQuery, statusFilter])
}
