import UploadIcon from '@/assets/upload.svg?react'
import PlusIcon from '@/assets/plus.svg?react'
import { useRef } from 'react'

interface UploadProps {
  onFilesUpload: (files: File[]) => void
  error: string | null
}

const Upload = ({ onFilesUpload, error }: UploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      onFilesUpload(Array.from(files))

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const files = event.dataTransfer.files
    if (files.length > 0) {
      onFilesUpload(Array.from(files))
    }
  }

  return (
    <div className="h-[296px] w-full p-6">
      <div
        className="flex h-[264px] w-full flex-col items-center justify-center rounded-lg border-2 border-dotted border-gray-300"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="mb-4 flex h-9 w-11 items-center justify-center text-gray-400">
          <UploadIcon className="h-full w-full" />
        </div>
        <h2 className="mb-2 text-lg font-medium text-gray-900">Upload Documents</h2>
        <p className="mb-4 text-center text-sm text-gray-500">Drag and drop files here or click to browse</p>
        <p className="mb-6 text-center text-xs text-gray-400">Supported formats: .pdf, .txt, .png</p>
        <button
          type="button"
          onClick={handleClickUpload}
          className="flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-white transition-colors hover:bg-blue-800"
        >
          <div className="h-3 w-3">
            <PlusIcon className="h-full w-full" />
          </div>
          <span className="text-center text-sm font-medium">Select Files</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".pdf,.txt,.png,.jpg,.jpeg"
          className="hidden"
        />
        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

export default Upload
