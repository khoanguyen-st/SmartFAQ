import { useMemo, useState, useEffect } from 'react'
import { GridConfig, UseGridPlaceholdersOptions } from '@/interfaces/FolderInterface'

const getGridConfig = (): GridConfig => {
  if (typeof window === 'undefined') {
    return { itemsPerRow: 1, maxRows: 2 }
  }

  const width = window.innerWidth
  const itemsPerRow = width >= 1280 ? 5 : width >= 1024 ? 4 : width >= 640 ? 2 : 1
  return {
    itemsPerRow,
    maxRows: 2
  }
}

/**
 *
 * @param totalItems - Total number of items in the list
 * @param currentPageItems - Number of items on current page
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @param hasUploadCard - Whether there's an upload card on first page
 * @returns Array of negative numbers representing placeholder keys
 */
const useGridPlaceholders = ({
  totalItems,
  currentPageItems,
  currentPage,
  totalPages,
  hasUploadCard = true
}: UseGridPlaceholdersOptions): number[] => {
  const [gridConfig, setGridConfig] = useState<GridConfig>(getGridConfig())

  useEffect(() => {
    const handleResize = () => {
      setGridConfig(getGridConfig())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const placeholders = useMemo(() => {
    const isLastPage = currentPage === totalPages

    if (!isLastPage || totalItems === 0) {
      return []
    }

    const { itemsPerRow, maxRows } = gridConfig
    const maxItemsOnGrid = maxRows * itemsPerRow
    const itemsOnPage = currentPage === 1 && hasUploadCard ? currentPageItems + 1 : currentPageItems
    const emptySlots = maxItemsOnGrid - itemsOnPage

    return emptySlots > 0 ? Array.from({ length: emptySlots }, (_, i) => -(i + 1)) : []
  }, [currentPage, totalPages, totalItems, currentPageItems, hasUploadCard, gridConfig])

  return placeholders
}

export default useGridPlaceholders

export const getGridColumnsClass = () => {
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
}

export interface PlaceholderRenderProps {
  key: number
  className?: string
}
