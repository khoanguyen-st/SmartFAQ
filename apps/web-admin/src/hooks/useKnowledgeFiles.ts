import { useState, useEffect, useCallback } from 'react';
import { IUploadedFile, fetchKnowledgeFiles, uploadKnowledgeFile, deleteKnowledgeFile } from '../lib/knowledge-api';

export const useKnowledgeFiles = () => {
  const [files, setFiles] = useState<IUploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
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
    
    const file = filesToUpload[0];
    if (!file) return;

    try {
      const newFile = await uploadKnowledgeFile(file);
      setFiles(prev => [newFile, ...prev]);
    } catch (err) {
      setUploadError((err as Error).message);
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
    uploadError,
    handleFileUpload,
    handleDeleteFile
  };
};