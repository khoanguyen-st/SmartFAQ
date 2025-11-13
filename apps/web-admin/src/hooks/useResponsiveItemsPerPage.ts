import { useState, useEffect, useCallback, useMemo } from 'react'
import { BreakpointConfig } from '@/interfaces/FolderInterface'
import { DEFAULT_GRID_CONFIG } from '@/constants/routes'

/**
 * Calculates the number of items per page based on the current screen width.
 * @param config - The breakpoint configuration.
 * @returns The determined number of items per page.
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
 * Custom hook to determine the number of items per page based on screen size.
 * Uses a debounced resize listener for performance.
 * @param customConfig - Optional custom breakpoint configuration (Partial).
 * @param onResize - Optional callback fired when the itemsPerPage value changes.
 * @returns The current items per page value.
 */
const useResponsiveItemsPerPage = (
  customConfig: Partial<BreakpointConfig> = {},
  onResize?: (itemsPerPage: number) => void
): number => {
  const breakpointConfig = useMemo<BreakpointConfig>(() => {
    return { ...DEFAULT_GRID_CONFIG, ...customConfig }
  }, [customConfig])

  const [itemsPerPage, setItemsPerPage] = useState<number>(() => calculateItemsPerPage(breakpointConfig))

  const handleResize = useCallback(() => {
    const newItemsPerPage = calculateItemsPerPage(breakpointConfig)

    if (newItemsPerPage !== itemsPerPage) {
      setItemsPerPage(newItemsPerPage)
      onResize?.(newItemsPerPage)
    }
  }, [breakpointConfig, itemsPerPage, onResize])

  useEffect(() => {
    let timeoutId: number | undefined

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
 * Gets the current breakpoint key based on the window width.
 * @returns The current breakpoint ('xs' | 'sm' | 'md' | 'lg' | 'xl').
 */
const getCurrentBreakpoint = (): keyof BreakpointConfig => {
  if (typeof window === 'undefined') return 'xs'

  const width = window.innerWidth
  if (width >= 1280) return 'xl'
  if (width >= 1024) return 'lg'
  if (width >= 768) return 'md'
  if (width >= 640) return 'sm'
  return 'xs'
}

/**
 * Combines itemsPerPage calculation with current breakpoint information.
 * @param customConfig - Optional custom breakpoint configuration.
 * @returns An object containing the current itemsPerPage and the active breakpoint.
 */
export const useResponsiveItemsPerPageWithInfo = (customConfig: Partial<BreakpointConfig> = {}) => {
  const itemsPerPage = useResponsiveItemsPerPage(customConfig)

  return {
    itemsPerPage,
    breakpoint: getCurrentBreakpoint()
  }
}
