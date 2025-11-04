import PDFIcon from '../../../assets/pdf.svg?react';
import TXTIcon from '../../../assets/txt.svg?react';
import DeleteIcon from '../../../assets/delete.svg?react';
import { IUploadedFile } from '../../lib/knowledge-api'; // Import interface từ tệp mới

// Định nghĩa props mới
interface UploadedFileProps {
  files: IUploadedFile[];
  onDeleteFile: (fileId: string) => void;
  isLoading: boolean;
  loadError: string | null;
}

// Hàm format kích thước file
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const UploadedFile = ({ files, onDeleteFile, isLoading, loadError }: UploadedFileProps) => {
  
  const getFileIcon = (fileType: string) => {
    // (Giữ nguyên logic getFileIcon của bạn)
    switch (fileType) {
      case 'pdf':
        return <PDFIcon className="w-[17.44px] h-[18px]" />;
      case 'txt':
        return <TXTIcon className="w-[18px] h-[18px]" />;
      default:
        return (
          <svg viewBox="0 0 18 18" className="w-[18px] h-[18px]">
            <path fill="currentColor" d="M4 2h10l4 4v10H4V2zm0 0v14h14V7h-3V2H4zm4 2h6v1H8V4z"/>
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // AC 7: Xử lý Lỗi tải
  if (loadError) {
    return (
      <div className="w-full p-6">
        <h3 className="text-sm font-medium text-[#374151] mb-8">Uploaded Files</h3>
        <div className="text-center py-8 text-red-600">
          Error: {loadError}
        </div>
      </div>
    );
  }

  // AC 7: Xử lý Loading
  if (isLoading) {
    return (
      <div className="w-full p-6">
        <h3 className="text-sm font-medium text-[#374151] mb-8">Uploaded Files</h3>
        <div className="text-center py-8 text-gray-500">
          Loading files...
        </div>
      </div>
    );
  }

  // AC 1: Hiển thị khi không có tệp
  if (files.length === 0) {
    return (
      <div className="w-full p-6">
        <h3 className="text-sm font-medium text-[#374151] mb-8">Uploaded Files</h3>
        <div className="text-center py-8 text-gray-500">
          No files uploaded yet
        </div>
      </div>
    );
  }

  // AC 4: Thêm hàm xác nhận xóa
  const handleDeleteClick = (fileId: string) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      onDeleteFile(fileId);
    }
  };

  return (
    <div className="w-full p-6">
      <h3 className="text-sm font-medium text-[#374151] mb-8">Uploaded Files</h3>
      
      <div className="space-y-3">
        {files.map((file) => (
          <div 
            key={file.id} 
            className="w-full h-[70px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg"
            // AC 3: Thêm title để xem chi tiết khi hover
            title={`File: ${file.name}\nSize: ${formatFileSize(file.size)}\nUploaded: ${formatDate(file.uploadDate)}`}
          >
            <div className="w-full h-full px-4 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-[18px] h-[18px] text-[#6B7280] flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-[#6B7280]">
                    Uploaded: {formatDate(file.uploadDate)}
                    {/* AC 1, AC 3: Hiển thị kích thước đã format */}
                    {` • ${formatFileSize(file.size)}`}
                  </p>
                </div>
              </div>
              <button 
                // AC 4: Gọi hàm xác nhận
                onClick={() => handleDeleteClick(file.id)}
                className="text-[#EF4444] hover:text-red-600 p-1 transition-colors flex-shrink-0"
              >
                <DeleteIcon className="w-[12.25px] h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadedFile;