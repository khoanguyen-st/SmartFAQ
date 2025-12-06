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
      // 1. Lọc theo Search (Username hoặc Email)
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)

      if (!matchesSearch) return false

      // 2. Lọc theo Department (Logic Mới)
      if (selectedDepartments.length > 0) {
        // Nếu user không có department nào thì loại bỏ
        if (!user.departments || user.departments.length === 0) {
          return false
        }
        
        // Kiểm tra xem user có thuộc ít nhất 1 trong các department được chọn không
        // (So sánh ID dạng string vì selectedDepartments đang lưu string)
        const hasMatchingDept = user.departments.some(dept => 
          selectedDepartments.includes(dept.id.toString())
        )
        
        if (!hasMatchingDept) return false
      }

      // 3. Lọc theo Status
      if (selectedStatuses.length > 0) {
        let status = 'Active'
        if (user.failed_attempts >= 5) status = 'Locked'
        else if (user.is_locked) status = 'Inactive'
        
        if (!selectedStatuses.includes(status)) return false
      }

      return true
    })
  }, [users, searchQuery, selectedDepartments, selectedStatuses])
}