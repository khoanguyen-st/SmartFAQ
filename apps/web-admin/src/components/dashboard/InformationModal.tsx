import React, { useState } from "react";

interface FileItem {
  id: string;
  name: string;
  size: number;
  progress: number;
}

interface InformationModalProps {
  onClose: () => void;
  selectedFiles: FileItem[];
}

const InformationModal: React.FC<InformationModalProps> = ({
  onClose,
  selectedFiles,
}) => {
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  const handleApply = () => {
    console.log("Batch update:");
    console.log("Category:", category);
    console.log("Tags:", tags);
    console.log("Selected files:", selectedFiles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white p-5 rounded-xl shadow-xl w-96">
        <h2 className="text-lg font-semibold mb-3">Edit File Information</h2>
        <p className="text-sm text-gray-600 mb-3">
          {selectedFiles.length} file(s) selected
        </p>

        <div className="mb-3">
          <label className="block text-sm font-medium">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Enter category..."
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Enter tags, separated by commas..."
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-300">
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1 rounded bg-blue-600 text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default InformationModal;
