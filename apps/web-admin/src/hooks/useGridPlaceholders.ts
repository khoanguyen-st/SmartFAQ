import { useMemo, useState, useEffect } from 'react'

interface UseGridPlaceholdersOptions {
  totalItems: number
  currentPageItems: number
  currentPage: number
  totalPages: number
  hasUploadCard?: boolean
}

interface GridConfig {
  itemsPerRow: number
  maxRows: number
}

/**
 * Get grid configuration based on screen width
 */
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
 * Custom hook to calculate placeholder slots for grid layout
 * Ensures the last page grid looks complete with empty slots
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

/**
 * Helper function to get grid columns class based on screen width
 * Useful for applying correct Tailwind classes
 */
export const getGridColumnsClass = () => {
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
}

/**
 * Type for placeholder render props
 */
export interface PlaceholderRenderProps {
  key: number
  className?: string
}
