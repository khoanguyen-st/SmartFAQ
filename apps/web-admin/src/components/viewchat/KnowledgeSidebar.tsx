import knowledgeUrl from '@/assets/icons/knowledge.svg'
import plusUrl from '@/assets/icons/plus.svg'
import sidebarUrl from '@/assets/icons/sidebar.svg'
import { cn } from '@/lib/utils'
import React from 'react'
import UploadedFile, { UploadedFileHandle } from './UploadedFile'

interface KnowledgeSidebarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (isOpen: boolean) => void
  handleSelectFileClick: () => void
  uploadedFileRef: React.RefObject<UploadedFileHandle>
}

const KnowledgeSidebar: React.FC<KnowledgeSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  handleSelectFileClick,
  uploadedFileRef
}) => {
  return (
    <div
      className={cn(
        'z-10 flex h-full flex-col border-r border-[#F3F4F6] bg-white transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'w-1/2 min-w-[400px]' : 'w-[118px]'
      )}
    >
      {/* Header Area */}
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-[#F3F4F6] transition-all duration-300',
          isSidebarOpen ? 'h-[92px] justify-between p-6' : 'h-[92px] justify-center'
        )}
      >
        {/* Title & Icon (Chỉ hiện khi MỞ) */}
        {isSidebarOpen && (
          <div className="flex flex-col overflow-hidden text-nowrap text-ellipsis">
            <div className="title-header flex items-center">
              <img src={knowledgeUrl} alt="knowledge" className="mr-2 h-6 w-6 shrink-0 text-[#003087]" />
              <h1 className="text-[18px] leading-7 font-semibold text-[#111827]">Knowledge Sources</h1>
            </div>
            <p className="text-[14px] text-[#6B7280]">Upload and manage documents</p>
          </div>
        )}

        <div className={cn('flex items-center', isSidebarOpen && 'gap-4')}>
          {isSidebarOpen && (
            <button
              onClick={handleSelectFileClick}
              className="flex h-[36px] items-center justify-center gap-2 rounded-[8px] bg-[#003087] px-4 transition-all hover:bg-[#00205a]"
              title="Upload Files"
            >
              <div className="flex items-center justify-center">
                <img src={plusUrl} alt="plus" className="h-3.5 w-3 text-white" />
              </div>
              <span className="text-sm font-medium text-white">Select Files</span>
            </button>
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              'group cursor-pointer rounded p-1 transition-colors hover:bg-gray-100',
              !isSidebarOpen && 'p-2'
            )}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <img
              src={sidebarUrl}
              alt="sidebar"
              className={cn(
                'h-6 w-6 text-gray-400 transition-transform group-hover:text-[#003087]',
                !isSidebarOpen && 'rotate-180'
              )}
            />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {!isSidebarOpen && (
          <div className="flex w-full shrink-0 justify-center py-4">
            <button
              onClick={handleSelectFileClick}
              className="flex h-[36px] w-[48px] items-center justify-center rounded-[8px] bg-[#003087] shadow-sm transition-colors hover:bg-[#00205a]"
              title="Upload Files"
            >
              <img src={plusUrl} alt="plus" className="h-3.5 w-3 text-white" />
            </button>
          </div>
        )}

        <div className={cn('flex-1 overflow-hidden', !isSidebarOpen && 'w-full px-[22px]')}>
          <UploadedFile ref={uploadedFileRef} isCompact={!isSidebarOpen} />
        </div>
      </div>
    </div>
  )
}

export default KnowledgeSidebar
