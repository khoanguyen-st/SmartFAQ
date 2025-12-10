import React from 'react'
import { Filter, Search } from 'lucide-react'
import type { FilterDropdownProps, SearchBarProps } from '@/interfaces/search-and-filter'
// XÓA hoặc COMMENT dòng này: import { getDepartmentOptions } from '@/constants/options'

const STATUS_MAPPING: Record<string, string> = {
  Active: 'Active',
  Inactive: 'Inactive',
  Locked: 'Locked'
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  selectedDepartments,
  selectedStatuses,
  onToggleDepartment,
  onToggleStatus,
  onClearFilters,
  departments = [] // <-- QUAN TRỌNG: Nhận props này
}) => {
  return (
    <div className="absolute top-full right-0 z-20 mt-3 w-64 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-2xl">
      <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">DEPARTMENT</p>

      {/* --- SỬA ĐOẠN NÀY --- */}
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {departments && departments.length > 0 ? (
          departments.map(dept => (
            <label key={dept.id} className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                // Dùng ID làm value để khớp với logic lọc
                checked={selectedDepartments.includes(dept.id.toString())}
                onChange={() => onToggleDepartment(dept.id.toString())}
              />
              {dept.name}
            </label>
          ))
        ) : (
          <p className="text-xs text-slate-400 italic">No departments available</p>
        )}
      </div>
      {/* ------------------- */}

      <p className="mt-4 mb-2 text-xs font-semibold text-slate-500 uppercase">STATUS</p>
      <div className="space-y-2">
        {Object.entries(STATUS_MAPPING).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={selectedStatuses.includes(value)}
              onChange={() => onToggleStatus(value)}
            />
            {label}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={onClearFilters}
        className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
      >
        Clear Filters
      </button>
    </div>
  )
}

// Component SearchBar giữ nguyên
export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  filterOpen,
  onToggleFilter,
  filterRef,
  renderFilterDropdown
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="relative flex h-[52px] items-center">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="h-full flex-1 border-none bg-transparent px-4 py-3 text-sm text-slate-600 outline-none placeholder:text-slate-400 md:px-6"
        />

        <div className="absolute right-4 flex items-center">
          <button
            type="button"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#637381] transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <Search className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <div className="mx-2 h-6 w-[1px] bg-slate-300" aria-hidden="true" />
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={onToggleFilter}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                filterOpen ? 'bg-blue-50 text-blue-600' : 'text-[#637381] hover:bg-slate-50 hover:text-slate-700'
              }`}
              aria-haspopup="true"
              aria-expanded={filterOpen}
            >
              <Filter className="h-6 w-6" strokeWidth={2.5} />
            </button>
            {filterOpen && renderFilterDropdown()}
          </div>
        </div>
      </div>
    </div>
  )
}
