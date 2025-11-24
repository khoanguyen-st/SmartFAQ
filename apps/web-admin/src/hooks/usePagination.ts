import { useMemo, useEffect, useState } from 'react'
import type { UsePaginationProps } from '@/interfaces/use-pagination'

export function usePagination<T>({ items, initialPage = 1, initialItemsPerPage = 10 }: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  const totalPages = Math.ceil(items.length / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [items.length, currentPage, totalPages])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems,
    setCurrentPage: goToPage,
    setItemsPerPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }
}
