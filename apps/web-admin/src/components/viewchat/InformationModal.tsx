import React, { useMemo, useState } from 'react'
import { FileItem } from './UploadModal'

interface InformationModalProps {
  onClose: () => void
  onSave: (updatedInfo: Record<string, { category?: string; tags?: string[] }>) => void
  existingInfo: Record<string, { category?: string; tags?: string[] }>
  selectedFiles: FileItem[]
}

const InformationModal: React.FC<InformationModalProps> = ({ onClose, onSave, existingInfo, selectedFiles }) => {
  const { initialCategory, initialTags } = useMemo(() => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return { initialCategory: '', initialTags: '' }
    }

    const categories = selectedFiles.map(f => existingInfo[f.id]?.category ?? '')
    const tagsArrays = selectedFiles.map(f => existingInfo[f.id]?.tags ?? [])

    const allSame = <T,>(arr: T[]) => arr.every(v => v === arr[0])

    const cat = allSame(categories) ? categories[0] : ''
    const tagsJoined = allSame(tagsArrays.map(a => (a ?? []).join(','))) ? (tagsArrays[0] ?? []).join(', ') : ''

    return { initialCategory: cat, initialTags: tagsJoined }
  }, [selectedFiles, existingInfo])

  const [category, setCategory] = useState<string>(initialCategory)
  const [tagsText, setTagsText] = useState<string>(initialTags)

  const handleSave = () => {
    const tagsArray = tagsText
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    const updated: Record<string, { category?: string; tags?: string[] }> = {}
    selectedFiles.forEach(f => {
      updated[f.id] = {
        category: category || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined
      }
    })

    onSave(updated)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-[420px] rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Update file information</h2>
        <p className="mb-6 text-sm text-gray-500">Modify and extend files.</p>

        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category</option>
            <option value="Document">Document</option>
            <option value="Report">Report</option>
            <option value="Contract">Contract</option>
          </select>

          <label className="mt-4 mb-2 block text-sm font-medium text-gray-700">
            Tag <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter tag"
            value={tagsText}
            onChange={e => setTagsText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          {selectedFiles.length > 1 && (
            <p className="mt-2 text-xs text-gray-500">This will apply to all selected files.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-full bg-[#002b70] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#001d4f]"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}

export default InformationModal