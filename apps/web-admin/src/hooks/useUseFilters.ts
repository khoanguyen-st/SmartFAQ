import { useMemo } from 'react'
import type { User } from '@/types/users'

interface UseUserFiltersProps {
  users: User[]
  searchQuery: string
  selectedDepartments: string[]
  selectedStatuses: string[]
}

export const useUserFilters = ({ users, searchQuery, selectedDepartments, selectedStatuses }: UseUserFiltersProps) => {
  return useMemo(() => {
    return users.filter(user => {
      // 1. Tìm kiếm text
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query || user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
      const matchesDepartment =
        selectedDepartments.length === 0 ||
        (user.departments && user.departments.some(dept => selectedDepartments.includes(dept)))
      let userStatus = 'Active'
      if (user.is_locked) {
        if (user.failed_attempts >= 5) {
          userStatus = 'Locked'
        } else {
          userStatus = 'Inactive'
        }
      }
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(userStatus)

      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [users, searchQuery, selectedDepartments, selectedStatuses])
}
