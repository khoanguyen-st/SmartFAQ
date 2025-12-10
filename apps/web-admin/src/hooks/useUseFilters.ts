import { useMemo } from 'react'
import type { User } from '@/types/users'

interface UseUserFiltersProps {
  users: User[]
  searchQuery: string
  selectedDepartments: string[] // ID các phòng ban được chọn
  selectedStatuses: string[]
}

export const useUserFilters = ({ users, searchQuery, selectedDepartments, selectedStatuses }: UseUserFiltersProps) => {
  return useMemo(() => {
    return users.filter(user => {
      // 1. Lọc theo Search
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        searchQuery === '' || user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)

      if (!matchesSearch) return false

      // -----------------------------------------------------------
      // 2. Lọc theo Department (Logic AND - Phải có ĐỦ các phòng đã chọn)
      // -----------------------------------------------------------
      if (selectedDepartments.length > 0) {
        // Nếu user không có department nào thì chắc chắn không thỏa mãn
        if (!user.departments || user.departments.length === 0) {
          return false
        }

        // LOGIC MỚI: Duyệt qua danh sách các phòng ĐANG ĐƯỢC CHỌN (selectedDepartments)
        // Kiểm tra xem User có chứa đủ tất cả các ID đó không.
        const hasAllSelectedDepts = selectedDepartments.every(selectedId =>
          // Tìm xem ID đã chọn có nằm trong list phòng ban của User không
          user.departments!.some(userDept => String(userDept.id) === selectedId)
        )

        if (!hasAllSelectedDepts) return false
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
