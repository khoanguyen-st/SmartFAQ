import React from 'react'
import { Filter } from 'lucide-react'
import type { User } from '../../../types/users'

const DepartmentOptions = ['Academic Affairs', 'Student Affairs', 'Information Technology']
const StatusOptions: Array<User['status']> = ['Active', 'Locked']

interface FilterDropdownProps {
  selectedDepartments: string[]
  selectedStatuses: User['status'][]
  onToggleDepartment: (dept: string) => void
  onToggleStatus: (status: User['status']) => void
  onClearFilters: () => void
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  selectedDepartments,
  selectedStatuses,
  onToggleDepartment,
  onToggleStatus,
  onClearFilters
}) => {
  return (
    <div className="absolute top-full right-0 z-20 mt-3 w-64 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-2xl">
      <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">Department</p>
      <div className="space-y-2">
        {DepartmentOptions.map(option => (
          <label key={option} className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={selectedDepartments.includes(option)}
              onChange={() => onToggleDepartment(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="mt-4 mb-2 text-xs font-semibold text-slate-500 uppercase">Status</p>
      <div className="space-y-2">
        {StatusOptions.map(option => (
          <label key={option} className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={selectedStatuses.includes(option)}
              onChange={() => onToggleStatus(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <button type="button" onClick={onClearFilters} className="mt-4 text-sm font-semibold text-blue-600">
        Clear filters
      </button>
    </div>
  )
}

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterOpen: boolean
  onToggleFilter: () => void
  filterRef: React.RefObject<HTMLDivElement>
  renderFilterDropdown: () => React.ReactNode
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  filterOpen,
  onToggleFilter,
  filterRef,
  renderFilterDropdown
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <input
          type="text"
          placeholder="Enter to Search..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="flex-1 border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
        />
        <div className="flex items-center gap-4">
          <button type="button" aria-label="Search" className="text-slate-400 hover:text-slate-600">
            <Filter className="h-4 w-4" />
          </button>
          <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={onToggleFilter}
              className={`text-slate-400 transition hover:text-slate-600 ${filterOpen ? 'text-blue-600' : ''}`}
              aria-haspopup="true"
              aria-expanded={filterOpen}
            >
              <Filter className="h-4 w-4" />
            </button>
            {filterOpen && renderFilterDropdown()}
          </div>
        </div>
      </div>
    </div>
  )
}
