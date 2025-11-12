import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MoreVertical } from 'lucide-react'
import { FolderIcon, ReloadIcon, TrashIcon, ViewIcon } from '@/assets/icon'
import { DocumentCardProps } from '@/interfaces/FolderInterface'
import { useTranslation } from 'react-i18next'

const DOCUMENT_ACTIONS = {
  VIEW: 'View',
  RE_UPLOAD: 'Re-upload',
  DELETE: 'Delete'
} as const

type DocumentActionType = (typeof DOCUMENT_ACTIONS)[keyof typeof DOCUMENT_ACTIONS]

const FolderCard: React.FC<DocumentCardProps> = ({ doc, onDelete, onView, onReupload, onSelect }) => {
  const { t } = useTranslation()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(prev => !prev)
  }, [])

  const handleAction = (actionType: DocumentActionType) => {
    setIsMenuOpen(false)
    switch (actionType) {
      case DOCUMENT_ACTIONS.VIEW:
        onView(doc)
        break
      case DOCUMENT_ACTIONS.RE_UPLOAD:
        onReupload(doc)
        break
      case DOCUMENT_ACTIONS.DELETE:
        onDelete(doc)
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCardClick = (e: React.MouseEvent) => {
    if (menuRef.current && menuRef.current.contains(e.target as Node)) {
      return
    }
    const target = e.target as HTMLElement
    if (target.closest('button')) {
      return
    }
    onSelect(doc)
  }

  return (
    <div
      onClick={handleCardClick}
      className="flex aspect-[290/200] w-full max-w-[300px] cursor-pointer flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e0ebfd]">
          <FolderIcon />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleMenu}
            className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => handleAction(DOCUMENT_ACTIONS.VIEW)}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ViewIcon className="mr-2 h-4 w-4" />
                {t('folder.viewFolder')}
              </button>
              <button
                onClick={() => handleAction(DOCUMENT_ACTIONS.RE_UPLOAD)}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ReloadIcon className="mr-2 h-4 w-4" />
                {t('folder.reUpload')}
              </button>
              <button
                onClick={() => handleAction(DOCUMENT_ACTIONS.DELETE)}
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                {t('folder.deleteFolder')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-[50px] flex-1 items-center">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{doc.title}</h3>
      </div>

      <div className="border-t border-gray-100 pt-3 text-sm text-gray-500">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            {doc.sources} {t('folder.sources')}
          </span>
          <span>
            {t('folder.lastUpdated')}: {doc.date}
          </span>
        </div>
      </div>
    </div>
  )
}

export default FolderCard
