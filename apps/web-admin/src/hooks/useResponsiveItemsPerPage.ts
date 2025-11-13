import { useState, useEffect, useCallback, useMemo } from 'react'
import { BreakpointConfig } from '@/interfaces/FolderInterface'

const DEFAULT_CONFIG: BreakpointConfig = {
  xl: 10,
  lg: 8,
  md: 6,
  sm: 4,
  xs: 3
}

/**
 * Calculate items per page based on current window width
 */
const calculateItemsPerPage = (config: BreakpointConfig): number => {
  if (typeof window === 'undefined') {
    return config.xs
  }

  const width = window.innerWidth

  if (width >= 1280) return config.xl
  if (width >= 1024) return config.lg
  if (width >= 768) return config.md
  if (width >= 640) return config.sm
  return config.xs
}

/**
 * Custom hook for responsive items per page
 * Automatically adjusts the number of items based on screen width
 *
 * @param config - Optional custom breakpoint configuration
 * @param onResize - Optional callback when screen size changes
 * @returns Current items per page value
 */
const useResponsiveItemsPerPage = (
  config: Partial<BreakpointConfig> = {},
  onResize?: (itemsPerPage: number) => void
): number => {
  const breakpointConfig = useMemo<BreakpointConfig>(() => {
    return { ...DEFAULT_CONFIG, ...config }
  }, [config])

  const [itemsPerPage, setItemsPerPage] = useState<number>(() => calculateItemsPerPage(breakpointConfig))

  const handleResize = useCallback(() => {
    const newItemsPerPage = calculateItemsPerPage(breakpointConfig)

    if (newItemsPerPage !== itemsPerPage) {
      setItemsPerPage(newItemsPerPage)
      onResize?.(newItemsPerPage)
    }
  }, [breakpointConfig, itemsPerPage, onResize])

  useEffect(() => {
    let timeoutId: number

    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(handleResize, 150)
    }

    window.addEventListener('resize', debouncedResize)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', debouncedResize)
    }
  }, [handleResize])

  return itemsPerPage
}

export default useResponsiveItemsPerPage

/**
 * Hook variant that returns both value and breakpoint info
 */
export const useResponsiveItemsPerPageWithInfo = (config: Partial<BreakpointConfig> = {}) => {
  const itemsPerPage = useResponsiveItemsPerPage(config)

  const getCurrentBreakpoint = useCallback((): keyof BreakpointConfig => {
    if (typeof window === 'undefined') return 'xs'

    const width = window.innerWidth
    if (width >= 1280) return 'xl'
    if (width >= 1024) return 'lg'
    if (width >= 768) return 'md'
    if (width >= 640) return 'sm'
    return 'xs'
  }, [])

  return {
    itemsPerPage,
    breakpoint: getCurrentBreakpoint()
  }
}
