import pdfUrl from '@/assets/icons/pdf.svg'
import reloadUrl from '@/assets/icons/reload.svg'
import trashUrl from '@/assets/icons/trash.svg'
import viewUrl from '@/assets/icons/view.svg'
import { MoreVertical } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

interface IDocument {
  id: number
  title: string
  date: string
  sources: number
}

interface MenuItemProps {
  children: React.ReactNode
  onClick: () => void
  className?: string
}

const MenuItem = ({ children, onClick, className = '' }: MenuItemProps) => (
  <button
    onClick={onClick}
    className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 ${className}`}
  >
    {children}
  </button>
)

interface DocumentCardProps {
  doc: IDocument
  onDelete: (doc: IDocument) => void
  onView: (doc: IDocument) => void
  onReupload: (doc: IDocument) => void
}

const DocumentCard = ({ doc, onDelete, onView, onReupload }: DocumentCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleAction = (actionType: 'View' | 'Re-upload' | 'Delete') => {
    setIsMenuOpen(false)

    switch (actionType) {
      case 'View':
        onView(doc)
        break
      case 'Re-upload':
        onReupload(doc)
        break
      case 'Delete':
        onDelete(doc)
        break
      default:
        console.warn(`Unknown action: ${actionType}`)
    }
  }

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(prev => !prev)
  }

  return (
    <div className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div className="rounded-xl bg-[#FEF2F2] p-2">
          <img src={pdfUrl} alt="pdf" className="h-6 w-6" />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={handleToggleMenu}
            className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg"
              onClick={e => e.stopPropagation()}
            >
              <MenuItem onClick={() => handleAction('View')}>
                <img src={viewUrl} alt="view" className="mr-2 h-4 w-4" />
                View document
              </MenuItem>
              <MenuItem onClick={() => handleAction('Re-upload')}>
                {' '}
                <img src={reloadUrl} alt="reload" className="mr-2 h-4 w-4" /> Re-upload
              </MenuItem>
              <MenuItem onClick={() => handleAction('Delete')} className="text-red-600 hover:bg-red-50">
                <img src={trashUrl} alt="delete" className="mr-2 h-4 w-4" />
                Delete document
              </MenuItem>
            </div>
          )}
        </div>
      </div>
      <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-800">{doc.title}</h3>
      <div className="mt-auto flex justify-between text-xs text-gray-500">
        <span>{doc.date}</span>
        <span>{doc.sources} sources</span>
      </div>
    </div>
  )
}
export default DocumentCard
