interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxPagesToShow?: number
}

export default function Pagination({ currentPage, totalPages, onPageChange, maxPagesToShow = 5 }: PaginationProps) {
  if (totalPages <= 1) return null

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }

  const pages = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 min-w-[32px] rounded border px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ←
      </button>

      {/* First page */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="h-8 min-w-[32px] rounded border border-transparent px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            1
          </button>
          {startPage > 2 && <span className="text-slate-400">...</span>}
        </>
      )}

      {/* Page numbers */}
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`h-8 min-w-[32px] rounded px-3 text-sm font-medium transition-colors ${
            currentPage === page
              ? 'border border-blue-600 bg-blue-600 text-white'
              : 'border border-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Last page */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="h-8 min-w-[32px] rounded border border-transparent px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 min-w-[32px] rounded border px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        →
      </button>
    </div>
  )
}
