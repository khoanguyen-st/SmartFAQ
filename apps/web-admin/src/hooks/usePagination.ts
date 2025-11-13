import { useState, useMemo, useCallback } from 'react'
import { UsePaginationOptions, UsePaginationReturn } from '@/interfaces/FolderInterface'

/**
 * @param items - Array of items to paginate
 * @param itemsPerPage - Number of items per page
 * @param onPageChange - Optional callback when page changes
 */
const usePagination = <T>({ items, itemsPerPage, onPageChange }: UsePaginationOptions<T>): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage))
  }, [items.length, itemsPerPage])

  const { startIndex, endIndex } = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return { startIndex: start, endIndex: end }
  }, [currentPage, itemsPerPage])

  const currentItems = useMemo(() => {
    return items.slice(startIndex, endIndex)
  }, [items, startIndex, endIndex])

  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages))

      if (validPage !== currentPage) {
        setCurrentPage(validPage)
        onPageChange?.(validPage)
      }
    },
    [currentPage, totalPages, onPageChange]
  )

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1)
    }
  }, [currentPage, hasNextPage, goToPage])

  const goToPreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      goToPage(currentPage - 1)
    }
  }, [currentPage, hasPreviousPage, goToPage])

  const goToFirstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])

  const goToLastPage = useCallback(() => {
    goToPage(totalPages)
  }, [totalPages, goToPage])

  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return {
    currentPage,
    totalPages,
    currentItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setCurrentPage
  }
}

export default usePagination
