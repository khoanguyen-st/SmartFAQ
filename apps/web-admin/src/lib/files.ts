const UPLOAD_MAX_MB = Number(import.meta.env.VITE_UPLOAD_MAX_MB) || 50
export const MAX_FILES = 20
export const MAX_SIZE = UPLOAD_MAX_MB * 1024 * 1024

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

  const errors: string[] = []

  const sizeValid = files.filter(f => f.size <= MAX_SIZE)
  if (sizeValid.length < files.length) {
    errors.push(`${files.length - sizeValid.length} file(s) rejected (max ${UPLOAD_MAX_MB}MB each)`)
  }

  const seenNames = new Set<string>()
  const noDuplicatesInBatch = sizeValid.filter(f => {
    const lowerName = f.name.toLowerCase()
    if (seenNames.has(lowerName)) {
      return false
    }
    seenNames.add(lowerName)
    return true
  })

  if (noDuplicatesInBatch.length < sizeValid.length) {
    errors.push(`${sizeValid.length - noDuplicatesInBatch.length} duplicate file(s) in batch removed`)
  }

  const noDuplicatesWithExisting = noDuplicatesInBatch.filter(f => !existingNames.includes(f.name.toLowerCase()))

  if (noDuplicatesWithExisting.length < noDuplicatesInBatch.length) {
    const count = noDuplicatesInBatch.length - noDuplicatesWithExisting.length
    errors.push(`${count} file(s) already exist`)
  }

  const typeValid = noDuplicatesWithExisting.filter(f => {
    const mimeOk = SUPPORTED_TYPES.includes(f.type)
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase()
    const extOk = allowedExtensions.includes(ext)
    return mimeOk || extOk
  })

  if (typeValid.length < noDuplicatesWithExisting.length) {
    const count = noDuplicatesWithExisting.length - typeValid.length
    errors.push(`${count} file(s) have unsupported format`)
  }

  const errorMessage = errors.length > 0 ? errors.join('. ') + '.' : null

  return {
    valid: typeValid,
    error: errorMessage
  }
}
