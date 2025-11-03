import React, { useState, useRef } from "react";

const UploadModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [files, setFiles] = useState<
    { id: string; name: string; size: number; progress: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 20;
  const MAX_SIZE = 25 * 1024 * 1024; // 25MB
  const SUPPORTED_TYPES = ["application/pdf"];

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setError(null);

    const arr = Array.from(newFiles);
    if (files.length + arr.length > MAX_FILES) {
      setError(`❌ You can upload up to ${MAX_FILES} files only.`);
      return;
    }

    const validFiles = arr.filter(
      (f) => SUPPORTED_TYPES.includes(f.type) && f.size <= MAX_SIZE
    );
    if (validFiles.length < arr.length) {
      setError("❌ Some files were rejected (only PDF ≤ 25MB allowed).");
    }

    const mapped = validFiles.map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: f.size,
      progress: 100,
    }));

    setFiles((prev) => [...prev, ...mapped]);
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleReplace = (id: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e: any) => {
        const newFile = e.target.files[0];
        if (!newFile) return;
        if (!SUPPORTED_TYPES.includes(newFile.type) || newFile.size > MAX_SIZE) {
          setError("❌ Invalid file (PDF ≤ 25MB only).");
          return;
        }
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, name: newFile.name, size: newFile.size, progress: 100 }
              : f
          )
        );
      };
      fileInputRef.current.click();
    }
  };

  const handleSave = () => {
    if (files.length === 0) {
      setError("❌ No files to process.");
      return;
    }
    setError(null);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-sm">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Upload Documents</h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload PDF documents to integrate into the chatbot knowledge base.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-lg p-10 text-center cursor-pointer hover:border-indigo-400 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fas fa-cloud-upload-alt text-4xl text-indigo-600 mb-3"></i>
            <p className="font-semibold text-gray-700">
              Drag & drop PDF files here or{" "}
              <span className="text-indigo-600 hover:underline">
                choose file to uploaded.
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported format: PDF | Max 20 files | Max 25MB each
            </p>

            <div className="mt-3 w-1/2 mx-auto">
              <p className="text-xs text-gray-600">Progress:</p>
              <div className="h-1 bg-gray-300 rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(files.length / MAX_FILES) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {files.length}/{MAX_FILES}
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center font-medium">{error}</p>
          )}

          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">Uploaded Files</h3>
            <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white max-h-60 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                  </div>
                  <div className="flex space-x-3 text-sm">
                    <button
                      onClick={() => handleReplace(file.id)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => handleRemove(file.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <p className="text-center text-gray-400 py-3">No files uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-indigo-700 flex items-center space-x-1">
            <i className="fas fa-info-circle"></i>
            <span>Uploaded files will be processed into the chatbot knowledge base.</span>
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-md"
            >
              Save & Process
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg animate-bounce">
          ✅ Uploaded documents have been processed successfully.
        </div>
      )}
    </div>
  );
};

export default UploadModal;
