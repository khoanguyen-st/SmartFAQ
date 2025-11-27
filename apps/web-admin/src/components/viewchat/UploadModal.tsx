import { MAX_FILES, MAX_SIZE, formatBytes, mapFiles, validateFiles } from '@/lib/files'
import React, { useEffect, useRef, useState } from 'react'
import iUrl from '../../assets/icons/i.svg'
import uploadUrl from '../../assets/icons/upload.svg'
import { getFileIcon } from '../../lib/icons'
import { uploadKnowledgeFiles } from '../../services/document.services'
import { X } from 'lucide-react'

export interface FileItem {
  id: string
  name: string
  size: number
  progress: number
}

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onFilesUploaded?: (files: { name: string; size: number; type: string }[]) => void
}

const UploadModal = ({ isOpen, onClose, onFilesUploaded }: UploadModalProps) => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [fileObjects, setFileObjects] = useState<Map<string, File>>(new Map())
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setFiles([])
      setFileObjects(new Map())
      setSelectedFiles([])
      setError(null)
      setSuccess(false)
      setIsSaving(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    setError(null)
    const arr = Array.from(newFiles)

    const { valid, error } = validateFiles(
      arr,
      files.length,
      files.map(f => f.name.toLowerCase())
    )

    if (error) {
      setError(error)
      return
    }

    const mapped = mapFiles(valid)
    setFiles(prev => [...prev, ...mapped])

    setFileObjects(prev => {
      const newMap = new Map(prev)
      valid.forEach(file => {
        const fileItem = mapped.find(f => f.name === file.name)
        if (fileItem) newMap.set(fileItem.id, file)
      })
      return newMap
    })
  }

  const handleRemoveSelected = () => {
    if (selectedFiles.length === 0) {
      setError('No files selected to remove.')
      return
    }

    setFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)))
    setFileObjects(prev => {
      const newMap = new Map(prev)
      selectedFiles.forEach(id => newMap.delete(id))
      return newMap
    })

    setSelectedFiles([])
  }

  const handleReplace = (id: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.txt,.md'
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const newFile = target.files?.[0]
      if (!newFile) return

      if (newFile.size > MAX_SIZE) {
        setError('Invalid file (max 10MB).')
        return
      }

      const existingNames = files.filter(f => f.id !== id).map(f => f.name.toLowerCase())

      if (existingNames.includes(newFile.name.toLowerCase())) {
        setError('Duplicate file detected. Please upload unique files only.')
        return
      }

      setError(null)
      setFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, name: newFile.name, size: newFile.size, progress: 100 } : f))
      )
      setFileObjects(prev => {
        const newMap = new Map(prev)
        newMap.set(id, newFile)
        return newMap
      })
    }
    input.click()
  }

  const handleSave = async () => {
    if (files.length === 0) {
      setError('No files to process.')
      return
    }

    if (isSaving) return

    setError(null)
    setIsSaving(true)
    setSuccess(true)

    const filesInfo = files.map(file => {
      const fileObj = fileObjects.get(file.id)
      const fileType = fileObj?.name.split('.').pop()?.toLowerCase() || 'file'
      return {
        name: file.name,
        size: file.size,
        type: fileType
      }
    })

    if (onFilesUploaded) {
      onFilesUploaded(filesInfo)
    }

    setTimeout(() => {
      onClose()
    }, 1000)

    try {
      const filesToUpload: File[] = []
      files.forEach(fileItem => {
        const fileObj = fileObjects.get(fileItem.id)
        if (fileObj) filesToUpload.push(fileObj)
      })

      if (filesToUpload.length > 0) {
        uploadKnowledgeFiles(filesToUpload).catch(error => {
          console.error('Upload error:', error)
        })
      }
    } catch (error) {
      console.error('Upload preparation error:', error)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose()
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedFiles(prev => (prev.includes(id) ? prev.filter(fileId => fileId !== id) : [...prev, id]))
  }

  const getFileBgClass = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return 'bg-red-100'
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'bg-green-100'
    if (fileName.endsWith('.txt')) return 'bg-blue-100'
    return 'bg-violet-100'
  }

  if (!isOpen) return null

  type ImgCompProps = React.ImgHTMLAttributes<HTMLImageElement>
  const InfoIcon: React.FC<ImgCompProps> = props => <img src={iUrl} alt="info" {...props} />
  const UploadIcon: React.FC<ImgCompProps> = props => <img src={uploadUrl} alt="upload" {...props} />

  return (
    <div
      className="bg-opacity-70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl sm:w-11/12 md:max-w-xl lg:max-w-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 sm:text-xl">Upload Documents</h2>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Upload reference materials to enhance chatbot responses for students.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSaving}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isSaving && fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed border-indigo-200 bg-slate-50 p-6 text-center transition hover:border-indigo-400 sm:p-10 ${
              isSaving ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 sm:h-16 sm:w-16">
              <UploadIcon className="h-[20px] w-[28px] sm:h-[21px] sm:w-[30px]" aria-hidden />
            </div>
            <p className="text-sm font-semibold text-gray-700 sm:text-base">
              Drag & drop files here or <span className="text-indigo-600 hover:underline">choose files to upload.</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: PDF,DOC, DOCX, TXT, MD <br />
              Maximum 20 files per upload, each ≤ 10MB
            </p>

            <div className="mx-auto mt-3 w-4/5 sm:w-1/2">
              <p className="text-xs text-gray-600">Progress:</p>
              <div className="mt-1 h-1 overflow-hidden rounded bg-gray-300">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(files.length / MAX_FILES) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-600">
                {files.length}/{MAX_FILES}
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md"
              disabled={isSaving}
              onChange={e => {
                handleFiles(e.target.files)
                e.currentTarget.value = ''
              }}
            />
          </div>

          {error && <p className="text-center text-sm font-medium text-red-500">{error}</p>}

          <div>
            <div className="max-h-52 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 sm:max-h-60 sm:p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 sm:text-base">Uploaded Files</h3>

                <button
                  onClick={handleRemoveSelected}
                  disabled={isSaving}
                  className="rounded-lg px-2 py-1 text-sm font-medium shadow-md transition-all duration-300 hover:scale-105 hover:bg-red-50 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
                >
                  <span className="text-red-500 hover:text-red-600">Remove</span>
                </button>
              </div>

              {files.length === 0 ? (
                <p className="py-3 text-center text-sm text-gray-400">No files uploaded yet.</p>
              ) : (
                files.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleSelect(file.id)}
                        disabled={isSaving}
                        className="h-4 w-4 shrink-0 cursor-pointer accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${getFileBgClass(file.name)} shrink-0`}
                      >
                        {(() => {
                          const IconComp = getFileIcon(file.name)
                          return <IconComp className="h-[14px] w-[14px] sm:h-[15px] sm:w-[15px]" />
                        })()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReplace(file.id)}
                      disabled={isSaving}
                      className="ml-2 shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Replace
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 p-4 sm:flex-row sm:gap-4 sm:p-6">
          <div className="w-full flex-1 sm:w-auto">
            <p className="flex items-start space-x-1 text-xs text-indigo-700">
              <InfoIcon className="mt-1 h-[14px] w-[14px] shrink-0" />
              <span className="block max-w-full sm:max-w-[360px]">
                Uploaded documents will be automatically processed into the chatbot knowledge base.
              </span>
            </p>
          </div>
          <div className="flex w-full justify-end space-x-3 sm:w-auto">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSaving ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
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
                  Processing...
                </>
              ) : (
                'Save & Process'
              )}
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="fixed right-4 bottom-4 animate-bounce rounded-lg bg-green-500 px-5 py-3 text-sm text-white shadow-lg sm:right-6 sm:bottom-6">
          Files are being processed in the background...
        </div>
      )}
    </div>
  )
}

export default UploadModal
