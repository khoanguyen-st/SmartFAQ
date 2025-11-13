export interface IUploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string; 
}

let mockFiles: IUploadedFile[] = [
  {
    id: '1',
    name: 'admission_guidelines.pdf',
    type: 'pdf',
    uploadDate: '2024-12-15T10:30:00Z',
    size: 2400000 // 2.4 MB
  },
  {
    id: '2', 
    name: 'student_handbook.txt',
    type: 'txt',
    uploadDate: '2024-12-14T11:00:00Z',
    size: 1200000 // 1.2 MB
  },
  {
    id: '3',
    name: 'scholarship_info.pdf',
    type: 'pdf',
    uploadDate: '2024-12-12T15:45:00Z',
    size: 3100000 // 3.1 MB
  }
];

// Simulate network latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// API: Get the list of files
export const fetchKnowledgeFiles = async (): Promise<IUploadedFile[]> => {
  await delay(500);
  // Simulate loading error (AC 7)
  // if (Math.random() > 0.8) {
  //   throw new Error("Unable to load file information");
  // }
  return [...mockFiles];
};

// API: Upload file (AC 2, AC 5)
export const uploadKnowledgeFile = async (file: File): Promise<IUploadedFile> => {
  await delay(1000);

  // AC 2: Check file size (assume 25MB)
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }

  const newFile: IUploadedFile = {
    id: Math.random().toString(36).substr(2, 9),
    name: file.name,
    type: file.name.split('.').pop() || 'unknown',
    uploadDate: new Date().toISOString(),
    size: file.size
  };

  mockFiles = [newFile, ...mockFiles];
  return newFile;
};

// API: Delete file (AC 4, AC 6)
export const deleteKnowledgeFile = async (fileId: string): Promise<{ id: string }> => {
  await delay(300);
  const index = mockFiles.findIndex(f => f.id === fileId);
  if (index > -1) {
    mockFiles.splice(index, 1);
    return { id: fileId };
  } else {
    throw new Error("File not found");
  }
};