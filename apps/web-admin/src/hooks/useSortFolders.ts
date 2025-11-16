import { useMemo } from 'react'
import { IKnowledgeFolder } from '@/interfaces/FolderInterface'

export const useSortFolders = (folders: IKnowledgeFolder[]): IKnowledgeFolder[] => {
  const sortedFolders = useMemo(() => {
    if (!folders || folders.length === 0) {
      return []
    }
    return folders.slice().sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })
  }, [folders])

  return sortedFolders
}
