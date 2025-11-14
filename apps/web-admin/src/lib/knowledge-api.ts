import { API_BASE_URL } from "./api";

export interface IUploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string; 
}

// Backend API response types
interface BackendDocument {
  id: number;
  title: string;
  category: string | null;
  tags: string | null;
  language: string;
  status: string;
  current_version_id: number | null;
  created_at: string | null;
  versions?: Array<{
    id: number;
    version_no: number;
    file_path: string;
    file_size: number | null;
    format: string;
    created_at: string | null;
  }>;
}

// Convert backend document to frontend format
const mapBackendToFrontend = (doc: BackendDocument): IUploadedFile => {
  // Get file info from version if available
  const version = doc.versions?.find(v => v.id === doc.current_version_id) || doc.versions?.[0];
  const fileName = version?.file_path ? version.file_path.split('/').pop() || doc.title : doc.title;
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'unknown';

  return {
    id: doc.id.toString(),
    name: fileName,
    size: version?.file_size || 0,
    type: version?.format || fileExtension,
    uploadDate: doc.created_at || new Date().toISOString(),
  };
};

// API: Get the list of files
export const fetchKnowledgeFiles = async (): Promise<IUploadedFile[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/docs/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const documents: BackendDocument[] = data.items || [];
    return documents.map(mapBackendToFrontend);
  } catch (error) {
    console.error("Failed to fetch knowledge files:", error);
    throw new Error("Unable to load file information");
  }
};

// API: Upload file(s) 
export const uploadKnowledgeFile = async (file: File): Promise<IUploadedFile> => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (from backend config)
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }

  const formData = new FormData();
  formData.append("files", file);

  try {
    const response = await fetch(`${API_BASE_URL}/api/docs/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // API returns {status: "accepted", items: [...]}
    if (data.items && data.items.length > 0) {
      // Get the uploaded document details
      const docId = data.items[0].id || data.items[0];
      // Fetch the full document to get version info
      const docResponse = await fetch(`${API_BASE_URL}/api/docs/${docId}`);
      if (docResponse.ok) {
        const doc: BackendDocument = await docResponse.json();
        return mapBackendToFrontend(doc);
      }
      // Fallback: create a basic response
      return {
        id: docId.toString(),
        name: file.name,
        size: file.size,
        type: file.name.split('.').pop() || 'unknown',
        uploadDate: new Date().toISOString(),
      };
    }
    throw new Error("No items returned from upload");
  } catch (error) {
    console.error("Failed to upload file:", error);
    throw error instanceof Error ? error : new Error("Failed to upload file");
  }
};

// API: Upload multiple files
export const uploadKnowledgeFiles = async (files: File[]): Promise<IUploadedFile[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);
  });
    console.log("API_BASE_URL =", API_BASE_URL);
    console.log("Uploading to:", `${API_BASE_URL}/api/docs/`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/docs/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      // Fetch full document details for each uploaded file
      const docPromises = data.items.map(async (item: any) => {
        const docId = item.id || item;
        try {
          const docResponse = await fetch(`${API_BASE_URL}/api/docs/${docId}`);
          if (docResponse.ok) {
            const doc: BackendDocument = await docResponse.json();
            return mapBackendToFrontend(doc);
          }
        } catch (err) {
          console.warn(`Failed to fetch doc ${docId}:`, err);
        }
        // Fallback
        const file = files.find(f => f.name === item.title);
        return {
          id: docId.toString(),
          name: item.title || file?.name || "unknown",
          size: file?.size || 0,
          type: file?.name.split('.').pop() || 'unknown',
          uploadDate: new Date().toISOString(),
        };
      });
      return Promise.all(docPromises);
    }
    throw new Error("No items returned from upload");
  } catch (error) {
    console.error("Failed to upload files:", error);
    throw error instanceof Error ? error : new Error("Failed to upload files");
  }
};

// API: Delete file (AC 4, AC 6)
export const deleteKnowledgeFile = async (fileId: string): Promise<{ id: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/docs/${fileId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Delete failed" }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return { id: fileId };
  } catch (error) {
    console.error("Failed to delete file:", error);
    throw error instanceof Error ? error : new Error("Failed to delete file");
  }
};