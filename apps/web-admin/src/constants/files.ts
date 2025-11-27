// File upload constants
export const FILE_UPLOAD = {
  MAX_FILES: 20,
  MAX_SIZE: 1000 * 1024 * 1024, // 1000MB
  MAX_FILE_SIZE_DOCUMENT: 50 * 1024 * 1024, // 50MB for document service
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.txt', '.md'],
  SUPPORTED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/x-markdown'
  ],
  BYTE_UNITS: ['Bytes', 'KB', 'MB'],
  BYTES_PER_KB: 1024
} as const

// Error messages
export const FILE_UPLOAD_ERRORS = {
  MAX_FILES_EXCEEDED: (maxFiles: number) => `You can upload up to ${maxFiles} files only.`,
  SIZE_EXCEEDED: 'Some files were rejected (max 10MB each).',
  DUPLICATE_FILE: 'Duplicate file detected. Please upload unique files only.',
  UNSUPPORTED_TYPE: 'Unsupported file type, only supported formats: PDF, DOCX, MD, TXT'
} as const
