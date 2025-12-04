import docUrl from '@/assets/icons/doc.svg'
import fileUrl from '@/assets/icons/file.svg'
import mdUrl from '@/assets/icons/md.svg'
import pdfUrl from '@/assets/icons/pdf.svg'
import trashUrl from '@/assets/icons/trash.svg'
import txtUrl from '@/assets/icons/txt.svg'
import editUrl from '@/assets/icons/edit.svg'
import { MAX_SIZE } from '@/lib/files'
import { cn } from '@/lib/utils'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { API_BASE_URL } from '../../lib/api'
import {
  IUploadedFile,
  deleteKnowledgeFile,
  fetchKnowledgeFiles,
  searchKnowledgeFiles,
  filterKnowledgeFiles
} from '../../services/document.services'
import DeleteConfirmationModal from './DeleteConfirmationModal'

export interface UploadedFileHandle {
  refreshFiles: () => Promise<void>
  addPendingFiles: (files: { name: string; size: number; type: string }[]) => void
  searchFiles: (searchTerm: string) => Promise<void>
  filterFiles: (format: string | undefined) => Promise<void>
}

interface UploadedFileProps {
  isCompact?: boolean
}

interface PendingFile {
  id: string
  name: string
  size: number
  type: string
  isPending: true
  timestamp: number
}

type FileItem = IUploadedFile | PendingFile

const PENDING_FILES_KEY = 'pending_upload_files'

const savePendingFiles = (files: PendingFile[]) => {
  try {
    sessionStorage.setItem(PENDING_FILES_KEY, JSON.stringify(files))
  } catch (e) {
    console.error('Failed to save pending files:', e)
  }
}

const loadPendingFiles = (): PendingFile[] => {
  try {
    const stored = sessionStorage.getItem(PENDING_FILES_KEY)
    if (!stored) return []

    const files: PendingFile[] = JSON.parse(stored)
    return files
  } catch (e) {
    console.error('Failed to load pending files:', e)
    return []
  }
}

const clearPendingFiles = () => {
  try {
    sessionStorage.removeItem(PENDING_FILES_KEY)
  } catch (e) {
    console.error('Failed to clear pending files:', e)
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const isPendingFile = (file: FileItem): file is PendingFile => {
  return 'isPending' in file && file.isPending === true
}

const UploadedFile = forwardRef<UploadedFileHandle, UploadedFileProps>(({ isCompact = false }, ref) => {
  const [files, setFiles] = useState<IUploadedFile[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>(() => loadPendingFiles())
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<IUploadedFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)

  const refreshFiles = useCallback(async () => {
    setLoadError(null)
    try {
      const fetchedFiles = await fetchKnowledgeFiles()

      setPendingFiles(prev => {
        const fetchedNames = new Set(fetchedFiles.map(f => f.name.toLowerCase()))

        let remaining = prev.filter(pf => !fetchedNames.has(pf.name.toLowerCase()))

        if (remaining.length > 0) {
          remaining = remaining.filter(pf => {
            const pendingBaseName = pf.name.toLowerCase().replace(/\.[^/.]+$/, '')

            const hasMatch = fetchedFiles.some(f => {
              const fetchedBaseName = f.name.toLowerCase().replace(/\.[^/.]+$/, '')
              return fetchedBaseName.includes(pendingBaseName) || pendingBaseName.includes(fetchedBaseName)
            })

            return !hasMatch
          })
        }

        savePendingFiles(remaining)

        if (remaining.length === 0 && prev.length > 0) {
          clearPendingFiles()
        }

        return remaining
      })

      setFiles(fetchedFiles)
    } catch (e) {
      console.error('Failed to load knowledge files:', e)
      setLoadError('Failed to load knowledge files.')
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  const addPendingFiles = useCallback((newFiles: { name: string; size: number; type: string }[]) => {
    const now = Date.now()
    const pending: PendingFile[] = newFiles.map(file => ({
      id: `pending-${now}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      isPending: true,
      timestamp: now
    }))

    setPendingFiles(prev => {
      const updated = [...prev, ...pending]
      savePendingFiles(updated)
      return updated
    })
  }, [])

  useEffect(() => {
    if (pendingFiles.length === 0) return

    const MAX_WAIT_TIME = 3 * 60 * 1000

    const checkPendingFiles = async () => {
      setPendingFiles(prev => {
        const now = Date.now()
        const remaining = prev.filter(file => {
          const fileAge = now - file.timestamp
          return fileAge <= MAX_WAIT_TIME
        })

        if (remaining.length < prev.length) {
          setError('Upload timeout - some files processing took too long')
        }

        savePendingFiles(remaining)
        return remaining
      })

      if (pendingFiles.length > 0) {
        await refreshFiles()
      }
    }

    const interval = setInterval(checkPendingFiles, 10000)

    return () => {
      clearInterval(interval)
    }
  }, [pendingFiles.length, refreshFiles])

  useEffect(() => {
    savePendingFiles(pendingFiles)
  }, [pendingFiles])

  useImperativeHandle(ref, () => ({
    refreshFiles,
    addPendingFiles,
    searchFiles,
    filterFiles
  }))

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    refreshFiles()
  }, [refreshFiles])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleViewFile = (fileId: string) => {
    window.open(`${API_BASE_URL}/api/docs/${fileId}/download`, '_blank')
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteKnowledgeFile(fileId)
    } catch (e) {
      console.error(e)
    } finally {
      await refreshFiles()
    }
  }

  const searchFiles = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        await refreshFiles()
        return
      }

      setLoadError(null)
      try {
        const searchedFiles = await searchKnowledgeFiles(searchTerm)
        setFiles(searchedFiles)
      } catch (e) {
        console.error('Failed to search knowledge files:', e)
        setLoadError('Failed to search knowledge files.')
      }
    },
    [refreshFiles]
  )

  const filterFiles = useCallback(
    async (format: string | undefined) => {
      const formatStr = typeof format === 'string' ? format : ''

      if (!formatStr || !formatStr.trim()) {
        await refreshFiles()
        return
      }

      setLoadError(null)
      try {
        const filteredFiles = await filterKnowledgeFiles(formatStr)
        setFiles(filteredFiles)
      } catch (e) {
        console.error('Failed to filter knowledge files:', e)
        setLoadError('Failed to filter knowledge files.')
      }
    },
    [refreshFiles]
  )

  const handleReplace = useCallback(
    (fileId: string) => {
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
    },
    [files]
  )

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

  const allFiles: FileItem[] = [...pendingFiles, ...files]

  if (loadError) return <div className="w-full p-6 text-center text-red-600">Error: {loadError}</div>
  if (isInitialLoading) return <div className="w-full p-6 text-center text-gray-500">Loading files...</div>
  if (allFiles.length === 0) {
    if (isCompact) {
      return null
    }
    return <div className="w-full p-6 text-center text-gray-500">No files uploaded yet</div>
  }

  return (
    <>
      <div
        className={cn(
          'uploaded__content scrollbar-hide flex h-full flex-col overflow-y-auto',
          isCompact ? 'items-center px-0 pt-4' : 'p-6'
        )}
      >
        {error && !isCompact && <p className="mb-3 text-center text-sm font-medium text-red-500">{error}</p>}

        <div className={cn('space-y-3', isCompact && 'flex w-full flex-col items-center space-y-3')}>
          {allFiles.map(file => {
            const isPending = isPendingFile(file)

            return (
              <div
                key={file.id}
                className={cn(
                  'group relative border border-[#E5E7EB] bg-white transition-all duration-500',
                  !isCompact && 'flex h-[70px] w-full items-center justify-between rounded-lg bg-[#F9FAFB] px-4',
                  isCompact && 'flex h-14 w-14 items-center justify-center rounded-xl shadow-sm hover:border-red-200',
                  isPending && 'border-blue-300 opacity-60'
                )}
                title={`File: ${file.name}\nSize: ${formatFileSize(file.size)}${isPending ? '\nStatus: Processing...' : ''}`}
              >
                {isPending && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-transparent">
                    <svg
                      className="h-5 w-5 animate-spin text-indigo-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                )}

                {isCompact ? (
                  <>
                    <div className="flex items-center justify-center text-[#6B7280]">{getFileIcon(file.type)}</div>
                    {!isPending && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleOpenDeleteModal(file as IUploadedFile)
                        }}
                        className="absolute -top-2 -right-2 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-white shadow-md ring-2 ring-white transition-all group-hover:flex"
                        title="Delete file"
                      >
                        <img src={trashUrl} alt="delete" className="h-3 w-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-[18px] w-[18px] shrink-0 text-[#6B7280]">{getFileIcon(file.type)}</div>
                      <div className="overflow-hidden">
                        <p
                          className={cn(
                            'truncate text-sm font-medium text-[#111827]',
                            !isPending && 'cursor-pointer transition-colors hover:text-indigo-600 hover:underline'
                          )}
                          onClick={() => !isPending && handleViewFile(file.id)}
                          title={isPending ? 'Processing...' : 'Click to view file'}
                        >
                          {file.name}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {isPending ? (
                            <span className="text-blue-600 italic">Processing... Please wait</span>
                          ) : (
                            <>
                              Uploaded: {formatDate((file as IUploadedFile).uploadDate)}
                              {` • ${formatFileSize(file.size)}`}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {!isPending && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => handleReplace(file.id)}
                          className="cursor-pointer rounded-full p-1.5 text-[#257FA0] transition-all hover:scale-110 hover:bg-green-50"
                          title="Replace file"
                        >
                          <img src={editUrl} alt="replace" className="h-3.5 w-[12.25px]" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(file as IUploadedFile)}
                          className="cursor-pointer rounded-full p-1.5 text-[#EF4444] transition-all hover:scale-110 hover:bg-red-50"
                        >
                          <img src={trashUrl} alt="delete" className="h-3.5 w-[12.25px]" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
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
