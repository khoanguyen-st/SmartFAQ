import { BreakpointConfig } from '@/interfaces/FolderInterface'

export const STORAGE_KEYS = {
  SELECTED_FOLDER_ID: 'selectedKnowledgeFolderId'
}

export const AppRoutes = {
  VIEW_CHAT: '/view-chat'
}

export const DOCUMENT_ACTION_KEYS = {
  VIEW: 'folder.viewFolder',
  REUPLOAD: 'folder.reUpload',
  DELETE: 'folder.deleteFolder'
}
export type DocumentActionType = keyof typeof DOCUMENT_ACTION_KEYS

export const DEFAULT_GRID_CONFIG: BreakpointConfig = {
  xl: 10,
  lg: 8,
  md: 6,
  sm: 4,
  xs: 3
} as const
