import { useState, useEffect, useCallback } from 'react';
import { IUploadedFile, fetchKnowledgeFiles, uploadKnowledgeFile, deleteKnowledgeFile } from '../lib/knowledge-api';

export const useKnowledgeFiles = () => {
  const [files, setFiles] = useState<IUploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  useEffect(() => {
    setLoading(true);
    fetchKnowledgeFiles()
      .then(setFiles)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = useCallback(async (filesToUpload: File[]) => {
    setUploadError(null);
    if (!filesToUpload || filesToUpload.length === 0) return;

    setIsUploading(true);

    const uploadPromises = filesToUpload.map(file => uploadKnowledgeFile(file));

    try {
      const results = await Promise.allSettled(uploadPromises);
      
      const successfulFiles: IUploadedFile[] = [];
      const failedFiles: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulFiles.push(result.value);
        } else {
          console.error(`Failed to upload ${filesToUpload[index].name}:`, result.reason);
          failedFiles.push(filesToUpload[index].name);
        }
      });

      if (successfulFiles.length > 0) {
        setFiles(prev => [...successfulFiles, ...prev]);
      }

      if (failedFiles.length > 0) {
        setUploadError(`Failed to upload: ${failedFiles.join(', ')}`);
      }

    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setIsUploading(false); // Kết thúc loading
    }
  }, []);

  const handleDeleteFile = useCallback(async (fileId: string) => {
    try {
      await deleteKnowledgeFile(fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (err) {
      console.error("Failed to delete file:", err);
      setError("Failed to delete file. Please try again.");
    }
  }, []);

  return {
    files,
    loading,
    error,
    isUploading,
    uploadError,
    handleFileUpload,
    handleDeleteFile
  };
};