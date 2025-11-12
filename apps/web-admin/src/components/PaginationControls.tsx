import React from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  goToPage: (page: number) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  hasNextPage: boolean
  hasPreviousPage: boolean
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  goToPage,
  goToNextPage,
  goToPreviousPage,
  hasNextPage,
  hasPreviousPage
}) => {
  if (totalPages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        onClick={goToPreviousPage}
        disabled={!hasPreviousPage}
        className="cursor-pointer rounded-lg border border-gray-300 p-2 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
      >
        <ArrowLeft />
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
        <button
          key={page}
          onClick={() => goToPage(page)}
          className={`cursor-pointer rounded-lg px-4 py-2 font-medium transition-colors ${
            page === currentPage
              ? 'bg-[#003087] text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={goToNextPage}
        disabled={!hasNextPage}
        className="cursor-pointer rounded-lg border border-gray-300 p-2 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
      >
        <ArrowRight />
      </button>
    </div>
  )
}

export default PaginationControls
