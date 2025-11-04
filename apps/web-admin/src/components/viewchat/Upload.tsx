import UploadIcon from '../../../assets/upload.svg?react';
import PlusIcon from '../../../assets/plus.svg?react';
import { useRef } from 'react';

interface UploadProps {
  onFilesUpload: (files: File[]) => void;
  error: string | null; // Thêm prop error
}

const Upload = ({ onFilesUpload, error }: UploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesUpload(Array.from(files));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      onFilesUpload(Array.from(files));
    }
  };

    return (
        <div className="w-full h-[296px] p-6">
          <div 
            className="w-full h-[264px] border-2 border-dotted border-gray-300 rounded-lg flex flex-col items-center justify-center"
            onDragOver={handleDragOver} 
            onDrop={handleDrop} 
          >
            <div className="w-11 h-9 text-gray-400 mb-4 flex items-center justify-center">
              <UploadIcon className="w-full h-full" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h2>
            <p className="text-sm text-gray-500 mb-4 text-center">
              Drag and drop files here or click to browse
            </p>
            <p className="text-xs text-gray-400 mb-6 text-center">
              Supported formats: .pdf, .txt, .png
            </p>
            <button 
              type="button" 
              onClick={handleClickUpload} 
              className="bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800 transition-colors"
            >
              <div className="w-3 h-3">
                <PlusIcon className="w-full h-full" />
              </div>
              <span className="text-sm font-medium text-center">Select Files</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              multiple 
              accept=".pdf,.txt,.png,.jpg,.jpeg"
              className="hidden" 
            />
            {/* AC 2: Hiển thị lỗi upload */}
            {error && (
              <p className="text-sm text-red-600 mt-4 text-center">{error}</p>
            )}
          </div>
        </div>
    );
};

export default Upload;