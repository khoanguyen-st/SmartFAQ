export interface IKnowledgeFolder {
  id: number
  title: string
  date: string
  sources: number
}

export interface DocumentCardProps {
  doc: IKnowledgeFolder
  onDelete: (doc: IKnowledgeFolder) => void
  onView: (doc: IKnowledgeFolder) => void
  onReupload: (doc: IKnowledgeFolder) => void
  onSelect: (doc: IKnowledgeFolder) => void
}
export interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  goToPage: (page: number) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface UseGridPlaceholdersOptions {
  totalItems: number
  currentPageItems: number
  currentPage: number
  totalPages: number
  hasUploadCard?: boolean
}

export interface GridConfig {
  itemsPerRow: number
  maxRows: number
}

export interface UsePaginationOptions<T> {
  items: T[]
  itemsPerPage: number
  onPageChange?: (page: number) => void
}

export interface UsePaginationReturn<T> {
  currentPage: number
  totalPages: number
  currentItems: T[]
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  goToPage: (page: number) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  setCurrentPage: (page: number) => void
}

export interface BreakpointConfig {
  xl: number
  lg: number
  md: number
  sm: number
  xs: number
}
