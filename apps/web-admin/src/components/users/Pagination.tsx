import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalCount: number
  pageSize?: number
  onPageSizeChange?: (size: number) => void
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize = 10,
  onPageSizeChange
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalCount)
  const endLabel = end < 10 ? `0${end}` : end

  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  const handlePageSizeClick = (size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size)
      setIsOpen(false)
    }
  }

  if (totalCount === 0) return null

  return (
    <div className="flex items-center justify-end border-t border-gray-200 px-4 py-3 sm:px-6">
      <div className="hidden sm:flex sm:items-center sm:gap-4">
        {/* Showing text */}
        <div className="flex h-6 w-[150px] items-center justify-end text-right text-base leading-6 font-medium whitespace-nowrap text-gray-900 opacity-60">
          Showing {start}-{endLabel} of {totalCount}
        </div>

        <nav className="isolate inline-flex items-center gap-1 -space-x-px" aria-label="Pagination">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative mr-1 inline-flex h-[22px] w-7 items-center justify-center rounded bg-transparent px-2 py-[5px] focus:z-20 focus:outline-offset-0 ${
              currentPage === 1 ? 'cursor-not-allowed text-gray-300' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft size={12} strokeWidth={2.5} aria-hidden="true" />
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) => {
            const isActive = page === currentPage
            const isEllipsis = typeof page !== 'number'
            return (
              <button
                key={index}
                onClick={() => (typeof page === 'number' ? onPageChange(page) : undefined)}
                disabled={isEllipsis}
                className={`relative inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg p-0 text-xs focus:z-20 focus:outline-offset-0 ${
                  isActive
                    ? 'border-2 border-[#1677FF] font-semibold text-[#1677FF]'
                    : 'border-none font-normal text-gray-700 hover:text-blue-600'
                } ${isEllipsis ? 'cursor-default text-gray-700' : ''}`}
              >
                {page}
              </button>
            )
          })}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`relative ml-1 inline-flex h-[22px] w-7 items-center justify-center rounded bg-transparent px-2 py-[5px] focus:z-20 focus:outline-offset-0 ${
              currentPage === totalPages ? 'cursor-not-allowed text-gray-300' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="sr-only">Next</span>
            <ChevronRight size={12} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </nav>

        {/* Page Size Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={!onPageSizeChange}
            className={`flex h-9 w-[70px] items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-base leading-6 font-normal text-gray-700 hover:bg-gray-50 focus:outline-none ${
              !onPageSizeChange ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <span>{pageSize}</span>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 bottom-full z-50 mb-1 w-full min-w-[124px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              {[5, 10, 20].map(size => (
                <button
                  key={size}
                  onClick={() => handlePageSizeClick(size)}
                  className={`w-full px-3 py-2 text-left text-[15px] transition-colors hover:bg-gray-50 ${
                    pageSize === size ? 'bg-blue-50 font-medium text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile View (Giữ nguyên vì đã dùng tailwind) */}
      <div className="flex w-full items-center justify-between sm:hidden">
        <div className="text-sm text-gray-500">
          {start}-{endLabel} of {totalCount}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default Pagination
