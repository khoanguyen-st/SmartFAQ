import React from 'react';
import { cn } from '@/lib/utils';
import SidebarIcon from '@/assets/icons/sidebar.svg?react';
import PlusIcon from '@/assets/icons/plus.svg?react';
import KnowledgeIcon from '@/assets/icons/knowledge.svg?react';
import UploadedFile, { UploadedFileHandle } from './UploadedFile'; 

interface KnowledgeSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  handleSelectFileClick: () => void;
  uploadedFileRef: React.RefObject<UploadedFileHandle>;
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
        'flex h-full flex-col transition-all duration-300 ease-in-out border-r border-[#F3F4F6] bg-white z-10',
        isSidebarOpen ? 'w-1/2 min-w-[400px]' : 'w-[118px]'
      )}
    >
      {/* Header Area */}
      <div
        className={cn(
          'flex items-center border-b border-[#F3F4F6] transition-all duration-300 shrink-0',
          isSidebarOpen ? 'justify-between p-6 h-[92px]' : 'justify-center h-[92px]'
        )}
      >
        {/* Title & Icon (Chỉ hiện khi MỞ) */}
        {isSidebarOpen && (
          <div className="flex flex-col overflow-hidden text-nowrap text-ellipsis">
            <div className="title-header flex items-center">
              <KnowledgeIcon className="mr-2 h-6 w-6 shrink-0 text-[#003087]" />
              <h1 className="text-[18px] font-semibold leading-7 text-[#111827]">Knowledge Sources</h1>
            </div>
            <p className="text-[14px] text-[#6B7280]">Upload and manage documents</p>
          </div>
        )}

        <div className={cn('flex items-center', isSidebarOpen && 'gap-4')}>
          {/* Nút Upload (Chỉ hiện trong header khi MỞ) */}
          {isSidebarOpen && (
            <button
              onClick={handleSelectFileClick}
              className="flex items-center justify-center h-[36px] gap-2 px-4 rounded-[8px] bg-[#003087] transition-all hover:bg-[#00205a]"
              title="Upload Files"
            >
              <div className="flex items-center justify-center">
                <PlusIcon className="h-3.5 w-3 text-white" />
              </div>
              <span className="text-sm font-medium text-white">Select Files</span>
            </button>
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              'cursor-pointer p-1 hover:bg-gray-100 rounded group transition-colors',
              !isSidebarOpen && 'p-2'
            )}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <SidebarIcon
              className={cn(
                'h-6 w-6 text-gray-400 transition-transform group-hover:text-[#003087]',
                !isSidebarOpen && 'rotate-180' 
              )}
            />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!isSidebarOpen && (
          <div className="w-full flex justify-center py-4 shrink-0">
            <button
              onClick={handleSelectFileClick}
              className="flex items-center justify-center w-[48px] h-[36px] rounded-[8px] bg-[#003087] hover:bg-[#00205a] transition-colors shadow-sm"
              title="Upload Files"
            >
              <PlusIcon className="h-3.5 w-3 text-white" />
            </button>
          </div>
        )}

        <div className={cn('flex-1 overflow-hidden', !isSidebarOpen && 'w-full px-[22px]')}>
          <UploadedFile 
            ref={uploadedFileRef}
            isCompact={!isSidebarOpen} 
          />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeSidebar;