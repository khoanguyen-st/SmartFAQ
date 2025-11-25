import docUrl from '@/assets/icons/doc.svg'
import fileUrl from '@/assets/icons/file.svg'
import mdUrl from '@/assets/icons/md.svg'
import pdfUrl from '@/assets/icons/pdf.svg'
import trashUrl from '@/assets/icons/trash.svg'
import txtUrl from '@/assets/icons/txt.svg'
import { MAX_SIZE } from '@/lib/files'
import { cn } from '@/lib/utils'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { API_BASE_URL } from '@/lib/api'
import { IUploadedFile, deleteKnowledgeFile, fetchKnowledgeFiles } from '@/services/document.services'
import DeleteConfirmationModal from './DeleteConfirmationModal'

export interface UploadedFileHandle {
  refreshFiles: () => Promise<void>
}

interface UploadedFileProps {
  isCompact?: boolean
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const UploadedFile = forwardRef<UploadedFileHandle, UploadedFileProps>(({ isCompact = false }, ref) => {
  const [files, setFiles] = useState<IUploadedFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<IUploadedFile | null>(null)

  const refreshFiles = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const fetchedFiles = await fetchKnowledgeFiles()
      setFiles(fetchedFiles)
    } catch (e) {
      console.error('Failed to load knowledge files:', e)
      setLoadError('Failed to load knowledge files.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    refreshFiles
  }))

  useEffect(() => {
    refreshFiles()
  }, [refreshFiles])

  const handleViewFile = (fileId: string) => {
    window.open(`${API_BASE_URL}/api/docs/${fileId}/download`, '_blank')
  }

  const handleDeleteFile = async (fileId: string) => {
    setIsLoading(true)
    try {
      await deleteKnowledgeFile(fileId)
      await refreshFiles()
    } catch (e) {
      alert('Error deleting file!')
      console.error(e)
      await refreshFiles()
    } finally {
      setIsLoading(false)
    }
  }

  const handleReplace = (fileId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.txt,.md'
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const newFile = target.files?.[0]
      if (!newFile) return

      if (newFile.size > MAX_SIZE) {
        alert('Invalid file (max 10MB).')
        return
      }

      const existingNames = files.filter(f => f.id !== fileId).map(f => f.name.toLowerCase())

      if (existingNames.includes(newFile.name.toLowerCase())) {
        alert('Duplicate file detected. Please upload unique files only.')
        return
      }

      setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, name: newFile.name, size: newFile.size } : f)))
    }
    input.click()
  }

  const getFileIcon = (fileType: string) => {
    const className = isCompact ? 'h-6 w-6' : 'h-[18px] w-[18px]'
    switch (fileType) {
      case 'pdf':
        return <img src={pdfUrl} alt="pdf" className={className} />
      case 'txt':
        return <img src={txtUrl} alt="txt" className={className} />
      case 'doc':
      case 'docx':
        return <img src={docUrl} alt="doc" className={className} />
      case 'md':
        return <img src={mdUrl} alt="md" className={className} />
      default:
        return <img src={fileUrl} alt="file" className={className} />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleOpenDeleteModal = (file: IUploadedFile) => setFileToDelete(file)
  const handleCancelDelete = () => setFileToDelete(null)
  const handleConfirmDelete = () => {
    if (fileToDelete) handleDeleteFile(fileToDelete.id)
    setFileToDelete(null)
  }

  if (loadError) return <div className="w-full p-6 text-center text-red-600">Error: {loadError}</div>
  if (isLoading) return <div className="w-full p-6 text-center text-gray-500">Loading files...</div>
  if (files.length === 0) return <div className="w-full p-6 text-center text-gray-500">No files uploaded yet</div>

  return (
    <>
      <div
        className={cn(
          'uploaded__content scrollbar-hide flex h-full flex-col overflow-y-auto',
          isCompact ? 'items-center px-0 pt-4' : 'p-6'
        )}
      >
        <div className={cn('space-y-3', isCompact && 'flex w-full flex-col items-center space-y-3')}>
          {files.map(file => (
            <div
              key={file.id}
              className={cn(
                'group relative border border-[#E5E7EB] bg-white transition-all duration-200',
                !isCompact && 'flex h-[70px] w-full items-center justify-between rounded-lg bg-[#F9FAFB] px-4',
                isCompact && 'flex h-14 w-14 items-center justify-center rounded-xl shadow-sm hover:border-red-200'
              )}
              title={`File: ${file.name}\nSize: ${formatFileSize(file.size)}`}
            >
              {isCompact ? (
                <>
                  <div className="flex items-center justify-center text-[#6B7280]">{getFileIcon(file.type)}</div>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleOpenDeleteModal(file)
                    }}
                    className="absolute -top-2 -right-2 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md ring-2 ring-white transition-all group-hover:flex"
                    title="Delete file"
                  >
                    <img src={trashUrl} alt="delete" className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-[18px] w-[18px] shrink-0 text-[#6B7280]">{getFileIcon(file.type)}</div>
                    <div className="overflow-hidden">
                      <p
                        className="cursor-pointer truncate text-sm font-medium text-[#111827] transition-colors hover:text-indigo-600 hover:underline"
                        onClick={() => handleViewFile(file.id)}
                        title="Click to view file"
                      >
                        {file.name}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        Uploaded: {formatDate(file.uploadDate)}
                        {` • ${formatFileSize(file.size)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => handleReplace(file.id)}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-indigo-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-800"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(file)}
                      className="cursor-pointer rounded-full p-1.5 text-[#EF4444] transition-all hover:scale-110 hover:bg-red-50"
                    >
                      <img src={trashUrl} alt="delete" className="h-3.5 w-[12.25px]" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={!!fileToDelete}
        documentTitle={fileToDelete?.name || ''}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
})

export default UploadedFile
