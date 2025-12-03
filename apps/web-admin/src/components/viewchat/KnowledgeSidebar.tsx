import knowledgeUrl from '@/assets/icons/knowledge.svg'
import plusUrl from '@/assets/icons/plus.svg'
import sidebarUrl from '@/assets/icons/sidebar.svg'
import { cn } from '@/lib/utils'
import React from 'react'
import UploadedFile, { UploadedFileHandle } from './UploadedFile'
import { X } from 'lucide-react'
import SearchFilterBar from '@/components/ui/SearchFilterBar'

interface KnowledgeSidebarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (isOpen: boolean) => void
  handleSelectFileClick: () => void
  uploadedFileRef: React.RefObject<UploadedFileHandle>
  onSearch?: (value: string) => void
}

const KnowledgeSidebar: React.FC<KnowledgeSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  handleSelectFileClick,
  uploadedFileRef,
  onSearch
}) => {
  const handleSearch = (value: string) => {
    onSearch?.(value)
  }

  const handleFilter = () => {}

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r border-[#F3F4F6] bg-white transition-all duration-300 ease-in-out',
        'fixed inset-0 z-30 lg:relative',
        isSidebarOpen ? 'w-full lg:w-1/2 lg:min-w-[400px]' : 'w-0 -translate-x-full lg:w-[118px] lg:translate-x-0',
        'overflow-hidden'
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-[#F3F4F6] transition-all duration-300',
          isSidebarOpen ? 'h-[92px] justify-between p-4 sm:p-6' : 'h-[92px] justify-center'
        )}
      >
        {isSidebarOpen && (
          <div className="flex flex-col overflow-hidden text-nowrap text-ellipsis">
            <div className="title-header flex items-center">
              <img src={knowledgeUrl} alt="knowledge" className="mr-2 h-6 w-6 shrink-0 text-[#003087]" />
              <h1 className="text-[18px] leading-7 font-semibold text-[#111827]">Knowledge Sources</h1>
            </div>
            <p className="hidden text-[14px] text-[#6B7280] sm:block">Upload and manage documents</p>
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
              <span className="hidden text-sm font-medium text-white sm:block">Select Files</span>
            </button>
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              'group cursor-pointer rounded p-1 transition-colors hover:bg-gray-100',
              !isSidebarOpen && 'p-2'
            )}
            title={isSidebarOpen ? 'Close sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? (
              <>
                <X className="h-6 w-6 lg:hidden" />
                <img
                  src={sidebarUrl}
                  alt="sidebar"
                  className="hidden h-6 w-6 text-gray-400 transition-transform group-hover:text-[#003087] lg:block"
                />
              </>
            ) : (
              <img
                src={sidebarUrl}
                alt="sidebar"
                className="h-6 w-6 rotate-180 text-gray-400 transition-transform group-hover:text-[#003087]"
              />
            )}
          </button>
        </div>
      </div>

      {isSidebarOpen && (
        <SearchFilterBar onSearch={handleSearch} onFilter={handleFilter} placeholder="Search documents..." />
      )}

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
