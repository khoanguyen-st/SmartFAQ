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
    id: String(doc.id), // Chuyển int sang string
    name: doc.title,
    size: doc.size || 0,
    type: doc.type || 'unknown',
    uploadDate: doc.created_at || new Date().toISOString(),
  };
};

// API: Get the list of files
export const fetchKnowledgeFiles = async (): Promise<IUploadedFile[]> => {
  const res = await fetch(`${API_BASE_URL}/docs/`);

  if (!res.ok) {
    console.error("Failed to fetch files", res);
    throw new Error("Unable to load file information");
  }
  
  const data = await res.json();

  if (data && data.items) {
    return data.items.map(mapBackendDocToFrontend);
  }
  return [];
};

// API: Upload file
export const uploadKnowledgeFile = async (file: File): Promise<IUploadedFile> => {
  const formData = new FormData();
  formData.append('files', file); // 'files' khớp với tên tham số 'files' trong docs.py

  const res = await fetch(`${API_BASE_URL}/docs/`, {
    method: 'POST',
    body: formData,
    // Không set 'Content-Type', trình duyệt sẽ tự làm đúng cho FormData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload' }));
    throw new Error(err.detail || `Failed to upload ${file.name}`);
  }

  const data = await res.json();
  
  // API trả về {"status": "accepted", "items": [{"document_id": ..., "file_path": ...}]}
  if (data.items && data.items.length > 0) {
    const newItem = data.items[0];
    if (newItem.error) {
      throw new Error(newItem.error);
    }
    
    // Tạo một đối tượng tạm thời để hiển thị ngay lập tức trên UI
    // Dữ liệu đầy đủ sẽ được lấy khi tải lại trang
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

// API: Delete file
export const deleteKnowledgeFile = async (fileId: string): Promise<{ id: string }> => {
  const res = await fetch(`${API_BASE_URL}/docs/${fileId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'File not found' }));
    throw new Error(err.detail || "File not found or could not be deleted");
  }
  
  // API trả về {"status": "deleted"}
  return { id: fileId };
};