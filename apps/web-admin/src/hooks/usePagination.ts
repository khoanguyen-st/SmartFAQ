import { useMemo } from 'react'

export interface UsePaginationProps<T> {
  items: T[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

export const usePagination = <T>({ items, page, pageSize }: UsePaginationProps<T>) => {
  const totalPages = Math.ceil(items.length / pageSize) || 1

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return { paginatedItems, totalPages }
}
