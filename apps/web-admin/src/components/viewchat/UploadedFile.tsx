import { useState } from 'react'
import PDFIcon from '@/assets/icons/pdf.svg?react'
import TXTIcon from '@/assets/icons/txt.svg?react'
import TrashIcon from '@/assets/icons/trash.svg?react'
import FileIcon from '@/assets/icons/file.svg?react'
import ImageIcon from '@/assets/icons/image-icon.svg?react'
import DocIcon from '@/assets/icons/doc.svg?react'

import DeleteConfirmationModal from './DeleteConfirmationModal'
import { IUploadedFile } from '@/lib/knowledge-api'
import { cn } from '@/lib/utils'

interface UploadedFileProps {
  files: IUploadedFile[]
  onDeleteFile: (fileId: string) => void
  isLoading: boolean
  loadError: string | null
  isCompact?: boolean
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const UploadedFile = ({ files, onDeleteFile, isLoading, loadError, isCompact = false }: UploadedFileProps) => {
  const [fileToDelete, setFileToDelete] = useState<IUploadedFile | null>(null)
  const getFileIcon = (fileType: string) => {
    const props = isCompact ? { className: 'h-6 w-6' } : { className: 'h-[18px] w-[18px]' }
    switch (fileType) {
      case 'pdf':
        return <PDFIcon {...props} />
      case 'md':
      case 'txt':
        return <TXTIcon {...props} />
      case 'doc':
      case 'docx':
        return <DocIcon {...props} />
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <ImageIcon {...props} />
      default:
        return <FileIcon {...props} />
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
    if (fileToDelete) onDeleteFile(fileToDelete.id)
    setFileToDelete(null)
  }

  if (loadError) return <div className="w-full p-6 text-center text-red-600">Error: {loadError}</div>
  if (isLoading) return <div className="w-full p-6 text-center text-gray-500">Loading files...</div>
  if (files.length === 0) {
  if (isCompact) return null;
  return <div className="w-full p-6 text-center text-gray-500">No files uploaded yet</div> }

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
                    className="absolute -top-2 -right-2 z-10 hidden h-5 w-5 items-center justify-center rounded-full text-white shadow-md ring-2 ring-white transition-all group-hover:flex"
                    title="Delete file"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-[18px] w-[18px] shrink-0 text-[#6B7280]">{getFileIcon(file.type)}</div>
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium text-[#111827]">{file.name}</p>
                      <p className="text-xs text-[#6B7280]">
                        Uploaded: {formatDate(file.uploadDate)}
                        {` • ${formatFileSize(file.size)}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDeleteModal(file)}
                    className="shrink-0 cursor-pointer rounded-full p-1 text-[#EF4444] transition-colors hover:scale-110 hover:bg-red-50"
                  >
                    <TrashIcon className="h-3.5 w-[12.25px]" />
                  </button>
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
}
export default UploadedFile
