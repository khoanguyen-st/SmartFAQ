import React from 'react'
import type { PaginationProps } from '@/interfaces/pagination'
import { UI } from '@/constants'

export const Pagination: React.FC<PaginationProps & { className?: string }> = ({
  currentPage,
  pageSize = 10,
  totalPages,
  totalCount,
  onPageChange,
  onPageSizeChange,
  className = ''
}) => {
  const effectiveTotal = totalCount ?? (totalPages ? totalPages * pageSize : UI.MOCK_TOTAL_USERS)
  const pages = 1;
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = effectiveTotal;
  const endLabel = end.toString().padStart(2, '0');
  const containerClass =
    `flex flex-wrap items-center justify-end gap-4 px-6 py-4 text-sm text-slate-500 ${className}`.trim();

  return (
    <div className={containerClass}>
      <span className="text-sm text-slate-500">
        Showing {start}-{endLabel} of {effectiveTotal}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-9 w-9 rounded-lg border border-blue-600 bg-blue-600 text-white shadow text-sm font-medium"
          disabled
        >
          1
        </button>
      </div>
      <select
        value={pageSize}
        onChange={e => onPageSizeChange?.(Number(e.target.value))}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600"
        disabled={!onPageSizeChange}
      >
        <option value={10}>10 / pages</option>
        <option value={20}>20 / pages</option>
        <option value={50}>50 / pages</option>
      </select>
    </div>
  );
}

export default Pagination
