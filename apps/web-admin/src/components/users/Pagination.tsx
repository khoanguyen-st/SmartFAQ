import React from 'react'
import type { PaginationProps } from '@/interfaces/pagination'

const MOCK_TOTAL = 50

export const Pagination: React.FC<PaginationProps & { className?: string }> = ({
  currentPage,
  pageSize = 10,
  totalPages,
  totalCount,
  onPageChange,
  onPageSizeChange,
  className = ''
}) => {
  const effectiveTotal = totalCount ?? (totalPages ? totalPages * pageSize : MOCK_TOTAL)
  const pages = totalPages ?? Math.max(1, Math.ceil(effectiveTotal / pageSize))
  // Always show 5 page buttons
  const maxDisplayPages = 5
  const displayedPages = Array.from({ length: maxDisplayPages }, (_, index) => index + 1)
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, effectiveTotal > 0 ? effectiveTotal : 5)
  const endLabel = end.toString().padStart(2, '0')
  const containerClass =
    `flex flex-wrap items-center justify-end gap-4 px-6 py-4 text-sm text-slate-500 ${className}`.trim()

  const changePage = (pageValue: number) => {
    if (pageValue < 1 || pageValue > pages || pageValue === currentPage) return
    onPageChange(pageValue)
  }

  return (
    <div className={containerClass}>
      <span className="text-sm text-slate-500">
        Showing {start}-{endLabel} of {effectiveTotal}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 w-9 rounded-lg border border-slate-200 text-base text-slate-500 transition enabled:hover:border-blue-200 enabled:hover:text-blue-600 disabled:opacity-40"
          aria-label="Previous page"
        >
          ‹
        </button>
        {displayedPages.map(p => {
          const isActive = p === currentPage
          return (
            <button
              key={p}
              type="button"
              onClick={() => changePage(p)}
              className={`h-9 w-9 rounded-lg border text-sm font-medium transition ${
                isActive
                  ? 'border-blue-600 bg-blue-600 text-white shadow'
                  : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {p}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === pages}
          className="h-9 w-9 rounded-lg border border-slate-200 text-base text-slate-500 transition enabled:hover:border-blue-200 enabled:hover:text-blue-600 disabled:opacity-40"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
      <select
        value={pageSize}
        onChange={e => onPageSizeChange?.(Number(e.target.value))}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600"
        disabled={!onPageSizeChange}
      >
        <option value={10}>10 / pages</option>
      </select>
    </div>
  )
}

export default Pagination
