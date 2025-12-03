import searchUrl from '@/assets/icons/search.svg'
import filterUrl from '@/assets/icons/filter.svg'
import { useState } from 'react'

interface SearchFilterBarProps {
  onSearch?: (value: string) => void
  onFilter?: () => void
  placeholder?: string
}

const SearchFilterBar = ({ onSearch, onFilter, placeholder = 'Enter to Search...' }: SearchFilterBarProps) => {
  const [searchValue, setSearchValue] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    onSearch?.(value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchValue)
  }

  return (
    <div className="w-full border-t border-[#E5E7EB] bg-white px-4 pt-5 sm:px-6">
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
      >
        <div className="relative flex flex-1 items-center">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="h-10 w-full rounded-lg pr-12 pl-4 text-sm text-gray-900 placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Search"
          >
            <img src={searchUrl} alt="search" className="h-4 w-4" />
          </button>
        </div>

        <div className="h-10 w-px bg-[#E5E7EB]" />

        <button
          type="button"
          onClick={onFilter}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Filter"
        >
          <img src={filterUrl} alt="filter" className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}

export default SearchFilterBar
