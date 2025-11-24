import type { User } from '../../types/users'

export interface FilterDropdownProps {
  selectedDepartments: string[]
  selectedStatuses: User['status'][]
  onToggleDepartment: (dept: string) => void
  onToggleStatus: (status: User['status']) => void
  onClearFilters: () => void
}

export interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterOpen: boolean
  onToggleFilter: () => void
  filterRef: React.RefObject<HTMLDivElement>
  renderFilterDropdown: () => React.ReactNode
}
