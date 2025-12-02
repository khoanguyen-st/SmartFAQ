import { useMemo } from 'react'
import type { User } from '@/types/users'

interface UseUserFiltersProps {
  users: User[]
  searchQuery: string
  selectedDepartments: string[]
  selectedStatuses: string[]
}

export const useUserFilters = ({
  users,
  searchQuery,
  selectedDepartments,
  selectedStatuses
}: UseUserFiltersProps) => {
  return useMemo(() => {
    return users.filter(user => {
      // 1. Tìm kiếm text
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)

      // 2. Lọc Department
      const matchesDepartment =
        selectedDepartments.length === 0 ||
        (user.departments && user.departments.some(dept => selectedDepartments.includes(dept)))

      // 3. Lọc Status (QUAN TRỌNG)
      let userStatus = 'Active' // Mặc định là Active
      
      if (user.is_locked) {
        // Nếu bị khóa và sai pass >= 5 lần -> Locked (Hệ thống khóa)
        if (user.failed_attempts >= 5) {
          userStatus = 'Locked'
        } else {
          // Nếu bị khóa mà không sai pass nhiều -> Inactive (Admin khóa tay)
          userStatus = 'Inactive'
        }
      }

      // So sánh: Nếu không chọn gì (length=0) thì lấy hết, ngược lại thì phải trùng status
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(userStatus)

      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [users, searchQuery, selectedDepartments, selectedStatuses])
}