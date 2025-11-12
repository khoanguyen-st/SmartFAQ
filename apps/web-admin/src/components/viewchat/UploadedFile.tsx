import { useState } from 'react'; 
import PDFIcon from '@/assets/pdf.svg?react'
import TXTIcon from '@/assets/txt.svg?react'
import DocIcon from '@/assets/doc.svg?react'
import TrashIcon from '@/assets/trash.svg?react'
import FileIcon from '@/assets/file.svg?react'
import ImageIcon from '@/assets/image-icon.svg?react'
import { IUploadedFile } from '../../lib/knowledge-api'
import DeleteConfirmationModal from './DeleteConfirmationModal'; 
import { cn } from '@/lib/utils';

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
  const [fileToDelete, setFileToDelete] = useState<IUploadedFile | null>(null);

  const getFileIcon = (fileType: string) => {
    const props = isCompact ? { className: "h-6 w-6" } : { className: "h-[18px] w-[18px]" };
    
    switch (fileType) {
      case 'pdf': return <PDFIcon {...props} />
      case 'txt': return <TXTIcon {...props} />
      case 'doc': 
      case 'docx': return <DocIcon {...props} />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'svg': return <ImageIcon {...props} />
      default: return <FileIcon {...props} />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleOpenDeleteModal = (file: IUploadedFile) => setFileToDelete(file);
  const handleCancelDelete = () => setFileToDelete(null);
  const handleConfirmDelete = () => {
    if (fileToDelete) onDeleteFile(fileToDelete.id);
    setFileToDelete(null);
  };

  if (loadError) return <div className="w-full p-6 text-center text-red-600">Error: {loadError}</div>
  if (isLoading) return <div className="w-full p-6 text-center text-gray-500">Loading files...</div>
  if (files.length === 0) return <div className="w-full p-6 text-center text-gray-500">No files uploaded yet</div>

  return (
    <>
      <div className={cn(
          "uploaded__content flex h-full flex-col overflow-y-auto scrollbar-hide", 
          isCompact ? "pt-4 px-0 items-center" : "p-6"
      )}>
        <div className={cn("space-y-3", isCompact && "space-y-3 w-full flex flex-col items-center")}> 
          {files.map(file => (
            <div
              key={file.id}
              className={cn(
                "relative group transition-all duration-200 bg-white border border-[#E5E7EB]",
                // Full mode: Hình chữ nhật dài
                !isCompact && "h-[70px] w-full rounded-lg flex items-center justify-between px-4 bg-[#F9FAFB]",
                // Compact mode: Hình vuông nhỏ gọn (56px), bo góc mềm mại hơn
                isCompact && "h-[56px] w-[56px] rounded-[12px] flex items-center justify-center hover:border-red-200 shadow-sm"
              )}
              title={`File: ${file.name}\nSize: ${formatFileSize(file.size)}`}
            >
              {isCompact ? (
                // --- Compact Layout ---
                <>
                    {/* Icon nằm chính giữa */}
                    <div className="flex items-center justify-center text-[#6B7280]">
                        {getFileIcon(file.type)}
                    </div>
                    
                    {/* Nút xóa (Trash Icon) - Hiển thị như badge thông báo màu đỏ ở góc */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteModal(file);
                        }}
                        className="absolute -top-2 -right-2 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full text-white shadow-md transition-all z-10 ring-2 ring-white"
                        title="Delete file"
                    >
                        <TrashIcon className="h-3 w-3" />
                    </button>
                </>
              ) : (
                // --- Full Layout (Giữ nguyên) ---
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
                    className="shrink-0 cursor-pointer p-1 text-[#EF4444] transition-colors hover:scale-110 hover:bg-red-50 rounded-full"
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