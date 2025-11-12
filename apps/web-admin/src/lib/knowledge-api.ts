import { API_BASE_URL } from './api';
export interface IUploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string; 
}

const mapBackendDocToFrontend = (doc: any): IUploadedFile => {
  return {
    id: String(doc.id), 
    name: doc.title,
    size: doc.size || 0,
    type: doc.type || 'unknown',
    uploadDate: doc.created_at || new Date().toISOString(),
  };
};

export const fetchKnowledgeFiles = async (): Promise<IUploadedFile[]> => {
  const res = await fetch(`${API_BASE_URL}/api/docs/`);

  if (!res.ok) {
    console.error("Failed to fetch files", res);
    throw new Error("Unable to load file information");
  }
  
  const data = await res.json();

  if (data && data.items) {
    const detailedFilesPromises = data.items.map(async (doc: any) => {
      try {
        const detailRes = await fetch(`${API_BASE_URL}/api/docs/${doc.id}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          
          const currentVersion = detailData.versions?.find((v: any) => v.id === detailData.current_version_id) 
                                 || detailData.versions?.[0];
          
          if (currentVersion) {
            return {
              ...doc,
              size: currentVersion.file_size, 
              type: currentVersion.format     
            };
          }
        }
      } catch (err) {
        console.warn(`Could not fetch details for doc ${doc.id}`, err);
      }
      return doc; 
    });

    const detailedFiles = await Promise.all(detailedFilesPromises);
    
    return detailedFiles.map(mapBackendDocToFrontend);
  }
  return [];
};

export const uploadKnowledgeFile = async (file: File): Promise<IUploadedFile> => {
  const formData = new FormData();
  formData.append('files', file); 

  const res = await fetch(`${API_BASE_URL}/api/docs/`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload' }));
    throw new Error(err.detail || `Failed to upload ${file.name}`);
  }

  const data = await res.json();

  if (data.items && data.items.length > 0) {
    const newItem = data.items[0];
    if (newItem.error) {
      throw new Error(newItem.error);
    }

    return {
      id: String(newItem.document_id),
      name: file.name,
      size: file.size,
      type: file.name.split('.').pop() || 'unknown',
      uploadDate: new Date().toISOString(),
    };
  }
  
  throw new Error('Upload completed but no item returned from API');
};

export const deleteKnowledgeFile = async (fileId: string): Promise<{ id: string }> => {
  const res = await fetch(`${API_BASE_URL}/api/docs/${fileId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'File not found' }));
    throw new Error(err.detail || "File not found or could not be deleted");
  }
  
  return { id: fileId };
};