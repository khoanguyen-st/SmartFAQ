import React, { useMemo, useState } from "react"
import { FileItem } from "./UploadModal"

interface InformationModalProps {
  onClose: () => void
  onSave: (updatedInfo: Record<string, { category?: string; tags?: string[] }>) => void
  existingInfo: Record<string, { category?: string; tags?: string[] }>
  selectedFiles: FileItem[]
}

const InformationModal: React.FC<InformationModalProps> = ({
  onClose,
  onSave,
  existingInfo,
  selectedFiles,
}) => {
  // Derive initial common values across selected files
  const { initialCategory, initialTags } = useMemo(() => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return { initialCategory: "", initialTags: "" }
    }

    const categories = selectedFiles.map((f) => existingInfo[f.id]?.category ?? "")
    const tagsArrays = selectedFiles.map((f) => existingInfo[f.id]?.tags ?? [])

    const allSame = <T,>(arr: T[]) => arr.every((v) => v === arr[0])

    const cat = allSame(categories) ? categories[0] : ""
    const tagsJoined = allSame(tagsArrays.map((a) => (a ?? []).join(",")))
      ? (tagsArrays[0] ?? []).join(", ")
      : ""

    return { initialCategory: cat, initialTags: tagsJoined }
  }, [selectedFiles, existingInfo])

  const [category, setCategory] = useState<string>(initialCategory)
  const [tagsText, setTagsText] = useState<string>(initialTags)

  const handleSave = () => {
    const tagsArray = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const updated: Record<string, { category?: string; tags?: string[] }> = {}
    selectedFiles.forEach((f) => {
      updated[f.id] = {
        category: category || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      }
    })

    onSave(updated)
    onClose()
  }

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-[420px]">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Update file information</h2>
        <p className="text-sm text-gray-500 mb-6">Modify and extend files.</p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select category</option>
            <option value="Document">Document</option>
            <option value="Report">Report</option>
            <option value="Contract">Contract</option>
          </select>

          <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">
            Tag <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter tag"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          {selectedFiles.length > 1 && (
            <p className="text-xs text-gray-500 mt-2">This will apply to all selected files.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium rounded-full bg-[#002b70] text-white hover:bg-[#001d4f] transition"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}

export default InformationModal
