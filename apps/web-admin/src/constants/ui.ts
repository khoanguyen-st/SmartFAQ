// Pagination constants
export const PAGINATION = {
  MAX_DISPLAY_PAGES: 5,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50]
} as const

// UI constants
export const UI = {
  MAX_ROWS_UPLOADED_DOCS: 3,
  MOCK_TOTAL_USERS: 50
} as const

// CSS class constants
export const CSS_CLASSES = {
  BADGE_BASE: 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
  BADGE_ACTIVE: 'bg-emerald-50 text-emerald-600',
  BADGE_LOCKED: 'bg-red-50 text-red-600'
} as const
