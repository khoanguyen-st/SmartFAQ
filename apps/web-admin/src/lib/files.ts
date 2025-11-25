import { FILE_UPLOAD, FILE_UPLOAD_ERRORS } from '@/constants/files'

export const MAX_FILES = FILE_UPLOAD.MAX_FILES
export const MAX_SIZE = FILE_UPLOAD.MAX_SIZE

export const SUPPORTED_TYPES = FILE_UPLOAD.SUPPORTED_MIME_TYPES

export const formatBytes = (bytes: number) => {
  const i = Math.floor(Math.log(bytes) / Math.log(FILE_UPLOAD.BYTES_PER_KB))
  return `${(bytes / Math.pow(FILE_UPLOAD.BYTES_PER_KB, i)).toFixed(2)} ${FILE_UPLOAD.BYTE_UNITS[i]}`
}

export const mapFiles = (newFiles: File[]) => {
  return newFiles.map(f => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: f.name,
    size: f.size,
    progress: 100
  }))
}

export const validateFiles = (
  files: File[],
  currentCount: number,
  existingNames: string[] = []
): { valid: File[]; error: string | null } => {
  if (currentCount + files.length > MAX_FILES) {
    return { valid: [], error: FILE_UPLOAD_ERRORS.MAX_FILES_EXCEEDED(MAX_FILES) }
  }

  const sizeValid = files.filter(f => f.size <= MAX_SIZE)
  if (sizeValid.length < files.length) {
    return { valid: sizeValid, error: FILE_UPLOAD_ERRORS.SIZE_EXCEEDED }
  }

  const seenNames = new Set<string>()
  const duplicatesInBatch: string[] = []
  for (const f of files) {
    const lowerName = f.name.toLowerCase()
    if (seenNames.has(lowerName)) {
      duplicatesInBatch.push(f.name)
    } else {
      seenNames.add(lowerName)
    }
  }
  if (duplicatesInBatch.length > 0) {
    return { valid: [], error: FILE_UPLOAD_ERRORS.DUPLICATE_FILE }
  }

  const duplicateFiles = files.filter(f => existingNames.includes(f.name.toLowerCase()))
  if (duplicateFiles.length > 0) {
    return { valid: [], error: FILE_UPLOAD_ERRORS.DUPLICATE_FILE }
  }

  const typeValid = sizeValid.filter(f => {
    const mimeOk = (SUPPORTED_TYPES as readonly string[]).includes(f.type)
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase()
    const extOk = (FILE_UPLOAD.ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
    return mimeOk || extOk
  })

  if (typeValid.length < sizeValid.length) {
    return { valid: typeValid, error: FILE_UPLOAD_ERRORS.UNSUPPORTED_TYPE }
  }

  return { valid: typeValid, error: null }
}
