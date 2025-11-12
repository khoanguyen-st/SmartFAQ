import { useState } from 'react'; 
import PDFIcon from '@/assets/pdf.svg?react'
import TXTIcon from '@/assets/txt.svg?react'
import DocIcon from '@/assets/doc.svg?react'
import TrashIcon from '@/assets/trash.svg?react'
import FileIcon from '@/assets/file.svg?react'
import ImageIcon from '@/assets/image-icon.svg?react'
import { IUploadedFile } from '../../lib/knowledge-api'
import DeleteConfirmationModal from './DeleteConfirmationModal'; 

interface UploadedFileProps {
  files: IUploadedFile[]
  onDeleteFile: (fileId: string) => void
  isLoading: boolean
  loadError: string | null
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const UploadedFile = ({ files, onDeleteFile, isLoading, loadError }: UploadedFileProps) => {
  // --- Thêm State cho Modal ---
  const [fileToDelete, setFileToDelete] = useState<IUploadedFile | null>(null);
  // --------------------------

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <PDFIcon className="h-[18px] w-[18px]" />
      case 'txt':
        return <TXTIcon className="h-[18px] w-[18px]" />
      case 'doc':
        return <DocIcon className="h-[18px] w-[18px]" />
      case 'docx':
        return <DocIcon className="h-[18px] w-[18px]" />
      case 'jpg':
        return <ImageIcon className="h-[18px] w-[18px]" />
      case 'jpeg':
        return <ImageIcon className="h-[18px] w-[18px]" />
      case 'png':
        return <ImageIcon className="h-[18px] w-[18px]" />
      case 'svg':
        return <ImageIcon className="h-[18px] w-[18px]" />
      default:
        return <FileIcon className="h-[18px] w-[18px]" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loadError) {
    return (
      <div className="w-full p-6">
        <h3 className="mb-8 text-sm font-medium text-[#374151]">Uploaded Files</h3>
        <div className="py-8 text-center text-red-600">Error: {loadError}</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <h3 className="mb-8 text-sm font-medium text-[#374151]">Uploaded Files</h3>
        <div className="py-8 text-center text-gray-500">Loading files...</div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="w-full p-6">
        <h3 className="mb-8 text-sm font-medium text-[#374151]">Uploaded Files</h3>
        <div className="py-8 text-center text-gray-500">No files uploaded yet</div>
      </div>
    )
  }

  // --- Cập nhật các hàm xử lý ---
  const handleOpenDeleteModal = (file: IUploadedFile) => {
    setFileToDelete(file);
  };

  const handleCancelDelete = () => {
    setFileToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      onDeleteFile(fileToDelete.id);
    }
    setFileToDelete(null);
  };
  // -----------------------------

  return (
    <> {/* Bọc bằng Fragment */}
      <div className="uploaded__content flex h-full flex-col overflow-y-auto">

        <div className="space-y-3">
          {files.map(file => (
            <div
              key={file.id}
              className="h-[70px] w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]"
              title={`File: ${file.name}\nSize: ${formatFileSize(file.size)}\nUploaded: ${formatDate(file.uploadDate)}`}
            >
              <div className="flex h-full w-full items-center justify-between px-4">
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
                  className="shrink-0 cursor-pointer p-1 text-[#EF4444] transition-colors hover:scale-110"
                >
                  <TrashIcon className="h-3.5 w-[12.25px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Thêm Modal vào cuối --- */}
      <DeleteConfirmationModal
        isOpen={!!fileToDelete}
        documentTitle={fileToDelete?.name || ''}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
      {/* --------------------------- */}
    </>
  )
}

export default UploadedFile