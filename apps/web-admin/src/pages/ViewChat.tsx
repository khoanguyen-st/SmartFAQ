import KnowledgeIcon from '../../assets/knowledge.svg?react';
import UploadedFile from '../components/viewchat/UploadedFile';
import Upload from '../components/viewchat/Upload';
import { useKnowledgeFiles } from '../hooks/useKnowledgeFiles';

const ViewChatPage = () => {
  const { 
    files, 
    loading, 
    error,  
    uploadError, 
    handleFileUpload, 
    handleDeleteFile 
  } = useKnowledgeFiles();

  return (
    <div className="flex w-full h-full">
      <div className="w-1/2 h-full bg-white">
        <div className="w-full h-[93px] border-b border-[#F3F4F6] px-6 py-5">
          <div className="flex items-center gap-3 mb-2">
            <KnowledgeIcon className="w-[20.25px] h-[15.75px]" />
            <h1 className="text-lg font-semibold leading-7 text-[#111827]">Knowledge Sources</h1>
          </div>
          <p className="text-sm text-gray-500">Upload and manage documents for chatbot training</p>
        </div>

        <Upload onFilesUpload={handleFileUpload} error={uploadError} />

        <UploadedFile 
          files={files}
          onDeleteFile={handleDeleteFile}
          isLoading={loading}
          loadError={error}
        />
      </div>
      
      <div className="chat">
        
      </div>
    </div>
  );
};

export default ViewChatPage;