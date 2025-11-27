import React from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, Search } from 'lucide-react'
import type { User } from '@/types/users'
import type { FilterDropdownProps, SearchBarProps } from '@/interfaces/search-and-filter'
import { getDepartmentOptions } from '@/constants/options'

const StatusOptions: Array<User['status']> = ['Active', 'Locked']

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  selectedDepartments,
  selectedStatuses,
  onToggleDepartment,
  onToggleStatus,
  onClearFilters
}) => {
  const { t } = useTranslation()
  return (
    <div className="absolute top-full right-0 z-20 mt-3 w-64 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-2xl">
      <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">{t('user.filter.department')}</p>
      <div className="space-y-2">
        {getDepartmentOptions().map(option => {
          const translated = t(option)
          return (
            <label key={option} className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={selectedDepartments.includes(translated)}
                onChange={() => onToggleDepartment(translated)}
              />
              {translated}
            </label>
          )
        })}
      </div>
      <p className="mt-4 mb-2 text-xs font-semibold text-slate-500 uppercase">{t('user.filter.status')}</p>
      <div className="space-y-2">
        {StatusOptions.map(option => (
          <label key={option} className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={selectedStatuses.includes(option)}
              onChange={() => onToggleStatus(option)}
            />
            {t(`user.status.${option.toLowerCase()}`)}
          </label>
        ))}
      </div>
      <button type="button" onClick={onClearFilters} className="mt-4 text-sm font-semibold text-blue-600">
        {t('common.clearFilters')}
      </button>
    </div>
  )
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
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Enter to Search..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="flex-1 border-none bg-transparent px-4 py-3 text-sm text-slate-600 outline-none placeholder:text-slate-400 md:px-6"
        />
        <div className="absolute right-4 flex items-center gap-3 md:right-6">
          <button type="button" aria-label="Search" className="flex items-center text-[#637381] hover:text-slate-600">
            <Search className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <div className="h-6 w-[0.5px] bg-[#637381]" aria-hidden="true" />
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={onToggleFilter}
              className={`flex items-center text-[#637381] transition hover:text-slate-600 ${filterOpen ? 'text-blue-600' : ''}`}
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
