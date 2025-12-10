import { API_BASE_URL } from '../lib/api'
import { MAX_SIZE } from '@/lib/files'

export interface IUploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadDate: string
  status?: 'REQUEST' | 'PROCESSING' | 'ACTIVE' | 'FAIL'
}

interface BackendDocument {
  id: number
  title: string
  category: string | null
  tags: string | null
  language: string
  status: string
  current_version_id: number | null
  created_at: string | null
  current_file_size: number | null
  current_format: string | null

  versions?: Array<{
    id: number
    version_no: number
    file_path: string
    file_size: number | null
    format: string
    created_at: string | null
  }>
}

type UploadItem = {
  id?: number
  document_id?: number
  task_id?: string
  title?: string
  status?: string
  file_name?: string
  filename?: string
  name?: string
  error?: string
}

const mapBackendToFrontend = (doc: BackendDocument): IUploadedFile => {
  const fileExtension = doc.current_format || doc.title.split('.').pop() || 'unknown'
  let fileName = doc.title
  if (fileExtension !== 'unknown' && !fileName.toLowerCase().endsWith(`.${fileExtension.toLowerCase()}`)) {
    fileName = `${fileName}.${fileExtension}`
  }

  return {
    id: doc.id.toString(),
    name: fileName,
    size: doc.current_file_size || 0,
    type: fileExtension,
    uploadDate: doc.created_at || new Date().toISOString(),
    status: doc.status as 'REQUEST' | 'PROCESSING' | 'ACTIVE' | 'FAIL'
  }
}

const DOCS_BASE_URL = `${API_BASE_URL}/api/docs`

const getAuthHeaders = (): HeadersInit => {
  const accessToken = localStorage.getItem('access_token')
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

export const fetchKnowledgeFiles = async (): Promise<IUploadedFile[]> => {
  try {
    const response = await fetch(`${DOCS_BASE_URL}/`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error - Status: ${response.status} on GET /api/docs/`, errorText)
      throw new Error(`Failed to list documents. Server responded with status: ${response.status}`)
    }

    const data: { items?: BackendDocument[] } = await response.json()
    const documents: BackendDocument[] = data.items || []
    return documents.map(mapBackendToFrontend)
  } catch (error) {
    console.error('Failed to fetch knowledge files:', error)
    throw error instanceof Error
      ? error
      : new Error('Unable to load file information due to network error or server issue.')
  }
}

export const uploadKnowledgeFiles = async (files: File[]): Promise<IUploadedFile[]> => {
  const MAX_FILE_SIZE = MAX_SIZE
  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'md']

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`)
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension) {
      throw new Error(`File "${file.name}" has no extension`)
    }

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(
        `File type ".${extension}" is not supported.\n` +
          `Only these file types are allowed: ${ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(', ')}`
      )
    }
  }

  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  try {
    const accessToken = localStorage.getItem('access_token')
    const response = await fetch(`${DOCS_BASE_URL}/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error - Status: ${response.status} on POST /api/docs/`, errorText)
      try {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      } catch {
        throw new Error(`Upload failed with status: ${response.status}`)
      }
    }

    const data: { items?: UploadItem[]; status?: string } = await response.json()

    if (!data.items || data.items.length === 0) {
      console.warn('Backend returned no items in upload response')

      return files.map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.name.split('.').pop() || 'unknown',
        uploadDate: new Date().toISOString()
      }))
    }

    const errors: string[] = []
    const successItems: UploadItem[] = []

    for (const item of data.items) {
      if (item.error) {
        const fileName = item.filename || item.title || item.file_name || item.name || 'unknown'
        errors.push(`${fileName}: ${item.error}`)
      } else {
        successItems.push(item)
      }
    }

    if (errors.length > 0 && successItems.length === 0) {
      throw new Error(`Upload failed:\n${errors.join('\n')}`)
    }

    if (errors.length > 0) {
      console.warn('Some files failed to upload:', errors)
    }

    const uploadedFiles: IUploadedFile[] = []

    for (const item of successItems) {
      const docId = item.document_id || item.id

      if (docId) {
        try {
          const docResponse = await fetch(`${DOCS_BASE_URL}/${docId}`, {
            headers: getAuthHeaders()
          })
          if (docResponse.ok) {
            const doc: BackendDocument = await docResponse.json()
            uploadedFiles.push(mapBackendToFrontend(doc))
            continue
          } else {
            console.warn(`Could not fetch details for doc ${docId}, status: ${docResponse.status}`)
          }
        } catch (err) {
          console.warn(`Failed to fetch doc ${docId} details after upload:`, err)
        }
      }

      const fileName = item.title || item.file_name || item.filename || item.name
      const matchingFile = files.find(
        f => f.name === fileName || f.name === item.title || f.name.includes(fileName || '')
      )

      const fileId = docId?.toString() || `pending-${Date.now()}-${uploadedFiles.length}`

      uploadedFiles.push({
        id: fileId,
        name: fileName || matchingFile?.name || 'unknown',
        size: matchingFile?.size || 0,
        type: (fileName || matchingFile?.name)?.split('.').pop() || 'unknown',
        uploadDate: new Date().toISOString()
      })
    }

    return uploadedFiles
  } catch (error) {
    console.error('Failed to upload files:', error)
    throw error instanceof Error ? error : new Error('Failed to upload files')
  }
}

export const deleteKnowledgeFile = async (fileId: string): Promise<{ id: string }> => {
  try {
    if (fileId.startsWith('temp-') || fileId.startsWith('pending-')) {
      console.warn(`Skipping deletion of temporary file ID: ${fileId}`)
      return { id: fileId }
    }

    const accessToken = localStorage.getItem('access_token')
    const response = await fetch(`${DOCS_BASE_URL}/${fileId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      try {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      } catch {
        throw new Error(`Delete failed with status: ${response.status}`)
      }
    }

    return { id: fileId }
  } catch (error) {
    console.error('Failed to delete file:', error)
    throw error instanceof Error ? error : new Error('Failed to delete file')
  }
}

export const searchKnowledgeFiles = async (name: string): Promise<IUploadedFile[]> => {
  try {
    const response = await fetch(`${DOCS_BASE_URL}/search?name=${encodeURIComponent(name)}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error - Status: ${response.status} on GET /api/docs/search`, errorText)
      throw new Error(`Failed to search documents. Server responded with status: ${response.status}`)
    }

    const data: { documents?: BackendDocument[] } = await response.json()
    const documents: BackendDocument[] = data.documents || []
    return documents.map(mapBackendToFrontend)
  } catch (error) {
    console.error('Failed to search knowledge files:', error)
    throw error instanceof Error ? error : new Error('Unable to search files due to network error or server issue.')
  }
}

export const filterKnowledgeFiles = async (format: string): Promise<IUploadedFile[]> => {
  try {
    const response = await fetch(`${DOCS_BASE_URL}/filter?format=${encodeURIComponent(format)}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error - Status: ${response.status} on GET /api/docs/filter`, errorText)
      throw new Error(`Failed to filter documents. Server responded with status: ${response.status}`)
    }

    const data: { documents?: BackendDocument[] } = await response.json()
    const documents: BackendDocument[] = data.documents || []
    return documents.map(mapBackendToFrontend)
  } catch (error) {
    console.error('Failed to filter knowledge files:', error)
    throw error instanceof Error ? error : new Error('Unable to filter files due to network error or server issue.')
  }
}

export interface DocumentStatus {
  document_id: number
  title: string
  status: string
  current_version_id: number | null
}

export const fetchDocumentsByStatus = async (status: string): Promise<DocumentStatus[]> => {
  try {
    const response = await fetch(`${DOCS_BASE_URL}/documents/status?document_status=${encodeURIComponent(status)}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error - Status: ${response.status} on GET /api/docs/documents/status`, errorText)
      throw new Error(`Failed to fetch documents by status. Server responded with status: ${response.status}`)
    }

    const data: { documents?: DocumentStatus[] } = await response.json()
    const documents: DocumentStatus[] = data.documents || []
    return documents
  } catch (error) {
    console.error('Failed to fetch documents by status:', error)
    throw error instanceof Error
      ? error
      : new Error('Unable to fetch documents by status due to network error or server issue.')
  }
}
