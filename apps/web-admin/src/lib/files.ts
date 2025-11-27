export const MAX_FILES = 20
export const MAX_SIZE = 1000 * 1024 * 1024

const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md']

export const SUPPORTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/x-markdown'
]

export const formatBytes = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
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
    return { valid: [], error: `You can upload up to ${MAX_FILES} files only.` }
  }

  const sizeValid = files.filter(f => f.size <= MAX_SIZE)
  if (sizeValid.length < files.length) {
    return { valid: sizeValid, error: 'Some files were rejected (max 10MB each).' }
  }

  // Check for duplicates within the new files array itself
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
    return { valid: [], error: 'Duplicate file detected. Please upload unique files only.' }
  }

  // Check for duplicates against existing files
  const duplicateFiles = files.filter(f => existingNames.includes(f.name.toLowerCase()))
  if (duplicateFiles.length > 0) {
    return { valid: [], error: 'Duplicate file detected. Please upload unique files only.' }
  }

  const typeValid = sizeValid.filter(f => {
    const mimeOk = SUPPORTED_TYPES.includes(f.type)
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase()
    const extOk = allowedExtensions.includes(ext)
    return mimeOk || extOk
  })

  if (typeValid.length < sizeValid.length) {
    return { valid: typeValid, error: ' Unsupported file type, only supported formats: PDF, DOCX, MD, TXT' }
  }

  return { valid: typeValid, error: null }
}