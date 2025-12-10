import React from 'react'
import type { Department } from '@/types/users'
export interface FilterDropdownProps {
  selectedDepartments: string[]
  selectedStatuses: string[]
  onToggleDepartment: (dept: string) => void
  onToggleStatus: (status: string) => void
  onClearFilters: () => void
  departments: Department[]
}

export interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterOpen: boolean
  onToggleFilter: () => void
  filterRef: React.RefObject<HTMLDivElement>
  renderFilterDropdown: () => React.ReactNode
}
