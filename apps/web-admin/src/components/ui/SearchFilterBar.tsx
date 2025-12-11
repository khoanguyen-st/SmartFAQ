import searchUrl from '@/assets/icons/search.svg'
import filterUrl from '@/assets/icons/filter.svg'
import pdfUrl from '@/assets/icons/pdf.svg'
import docxUrl from '@/assets/icons/doc.svg'
import txtUrl from '@/assets/icons/txt.svg'
import mdUrl from '@/assets/icons/md.svg'
import { useState } from 'react'

interface SearchFilterBarProps {
  onSearch?: (value: string) => void
  onFilter?: (format: string) => void
  placeholder?: string
}

const DOCUMENT_FORMATS = [
  { format: 'pdf', icon: pdfUrl },
  { format: 'docx', icon: docxUrl },
  { format: 'txt', icon: txtUrl },
  { format: 'md', icon: mdUrl }
]

const SearchFilterBar = ({ onSearch, onFilter, placeholder = 'Enter to Search...' }: SearchFilterBarProps) => {
  const [searchValue, setSearchValue] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<string>('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    onSearch?.(value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchValue)
  }

  const handleFormatSelect = (format: string) => {
    const newFormat = selectedFormat === format ? '' : format
    setSelectedFormat(newFormat)
    onFilter?.(newFormat)
    setShowFilterMenu(false)
  }

  return (
    <div className="w-full border-t border-[#E5E7EB] bg-white px-4 pt-5 sm:px-6">
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
      >
        <div className="relative flex flex-1 items-center">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="h-10 w-full rounded-lg pr-12 pl-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
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

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
              selectedFormat ? 'bg-indigo-100 text-[#003087]' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title="Filter by format"
          >
            <img src={filterUrl} alt="filter" className="h-5 w-5" />
          </button>

          {showFilterMenu && (
            <div className="absolute top-12 right-0 z-10 min-w-max rounded-lg border border-gray-200 bg-white shadow-lg">
              {DOCUMENT_FORMATS.map(({ format, icon }) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => handleFormatSelect(format)}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                    selectedFormat === format
                      ? 'bg-indigo-100 font-medium text-[#003087]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <img src={icon} alt={format + ' icon'} className="h-5 w-5" />
                </button>
              ))}
              {selectedFormat && (
                <>
                  <div className="h-px bg-gray-200" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormat('')
                      onFilter?.('')
                      setShowFilterMenu(false)
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Clear filter
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

export default SearchFilterBar
