import {
    MAX_FILES,
    MAX_SIZE,
    formatBytes,
    mapFiles,
    validateFiles,
} from "@/lib/files";
import React, { useEffect, useRef, useState } from "react";
import iUrl from "../../assets/icons/i.svg";
import uploadUrl from "../../assets/icons/upload.svg";
import { getFileIcon } from "../../lib/icons";
import { uploadKnowledgeFiles } from "../../services/document.services";
import InformationModal from "./InformationModal";
export interface FileItem {
  id: string;
  name: string;
  size: number;
  progress: number;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadModal = ({ isOpen, onClose }: UploadModalProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [fileObjects, setFileObjects] = useState<Map<string, File>>(new Map());
  const [fileInfo, setFileInfo] = useState<Record<string, { category?: string; tags?: string[] }>>({});
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setFileObjects(new Map());
      setSelectedFiles([]);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setError(null);
    const arr = Array.from(newFiles);

    const { valid, error } = validateFiles(
      arr,
      files.length,
      files.map((f) => f.name.toLowerCase())
    );

    if (error) {
      setError(error);
      return;
    }

    const mapped = mapFiles(valid);
    setFiles((prev) => [...prev, ...mapped]);

    setFileObjects((prev) => {
      const newMap = new Map(prev);
      valid.forEach((file) => {
        const fileItem = mapped.find((f) => f.name === file.name);
        if (fileItem) newMap.set(fileItem.id, file);
      });
      return newMap;
    });
  };

  const handleRemoveSelected = () => {
    if (selectedFiles.length === 0) {
      setError("No files selected to remove.");
      return;
    }

    setFiles((prev) => prev.filter((f) => !selectedFiles.includes(f.id)));
    setFileObjects((prev) => {
      const newMap = new Map(prev);
      selectedFiles.forEach((id) => newMap.delete(id));
      return newMap;
    });

    setFileInfo((prev) => {
      const updated = { ...prev };
      selectedFiles.forEach((id) => delete updated[id]);
      return updated;
    });

    setSelectedFiles([]);
  };

  const handleReplace = (id: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.txt,.md";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const newFile = target.files?.[0];
      if (!newFile) return;

      if (newFile.size > MAX_SIZE) {
        setError("Invalid file (max 10MB).");
        return;
      }

      const existingNames = files
        .filter((f) => f.id !== id)
        .map((f) => f.name.toLowerCase());

      if (existingNames.includes(newFile.name.toLowerCase())) {
        setError("Duplicate file detected. Please upload unique files only.");
        return;
      }

      setError(null);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, name: newFile.name, size: newFile.size, progress: 100 }
            : f
        )
      );
      setFileObjects((prev) => {
        const newMap = new Map(prev);
        newMap.set(id, newFile);
        return newMap;
      });
    };
    input.click();
  };

  const handleSave = async () => {
    if (files.length === 0) {
      setError("No files to process.");
      return;
    }

    setError(null);
    setSuccess(false);

    try {
      const filesToUpload: File[] = [];
      files.forEach((fileItem) => {
        const fileObj = fileObjects.get(fileItem.id);
        if (fileObj) filesToUpload.push(fileObj);
      });

      if (filesToUpload.length === 0) throw new Error("No valid files to upload");

      await uploadKnowledgeFiles(filesToUpload);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (error) {
      console.error("Upload error:", error);
      setError(error instanceof Error ? error.message : "Failed to upload files");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]
    );
  };

  const getFileBgClass = (fileName: string) => {
    if (fileName.endsWith(".pdf")) return "bg-red-100";
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) return "bg-green-100";
    if (fileName.endsWith(".txt")) return "bg-blue-100";
    return "bg-violet-100";
  };

  if (!isOpen) return null;

  type ImgCompProps = React.ImgHTMLAttributes<HTMLImageElement>;
  const InfoIcon: React.FC<ImgCompProps> = (props) => <img src={iUrl} alt="info" {...props} />;
  const UploadIcon: React.FC<ImgCompProps> = (props) => <img src={uploadUrl} alt="upload" {...props} />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-70 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Upload Documents</h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload reference materials to enhance chatbot responses for students.
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
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 rounded-lg p-10 text-center cursor-pointer hover:border-indigo-400 transition bg-slate-50"
          >
            <div className="mx-auto mb-3 flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100">
              <UploadIcon className="w-[30px] h-[21px]" aria-hidden />
            </div>
            <p className="font-semibold text-gray-700">
              Drag & drop files here or{" "}
              <span className="text-indigo-600 hover:underline">choose files to upload.</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF,DOC, DOCX, TXT, MD <br />
              Maximum 20 files per upload, each ≤ 10MB
            </p>

            <div className="mt-3 w-1/2 mx-auto">
              <p className="text-xs text-gray-600">Progress:</p>
              <div className="h-1 bg-gray-300 rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(files.length / MAX_FILES) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {files.length}/{MAX_FILES}
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}

          <div>
            <div className="border border-gray-200 rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold text-gray-700">Uploaded Files</h3>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (selectedFiles.length === 0) {
                        setError("Please select at least one file to update.")
                        return
                      }
                      setShowInfoModal(true)
                    }}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-md hover:bg-indigo-700 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
                  >
                    <span>Update</span>
                  </button>
                  <button
                    onClick={handleRemoveSelected}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-red-50 active:scale-95"
                  >
                    <span className="text-red-500 hover:text-red-600">Remove</span>
                  </button>
                </div>
              </div>

              {files.length === 0 ? (
                <p className="text-center text-gray-400 py-3">No files uploaded yet.</p>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleSelect(file.id)}
                        className="accent-indigo-600 cursor-pointer w-4 h-4"
                      />
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-lg ${getFileBgClass(file.name)}`}
                      >
                        {(() => {
                          const IconComp = getFileIcon(file.name);
                          return <IconComp className="w-[15px] h-[15px]" />;
                        })()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                        {(() => {
                          const info = fileInfo[file.id];
                          if (!info) return null;
                          return (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              {info.category ? ` ${info.category}` : ""}{" "}
                              {Array.isArray(info.tags) && info.tags.length > 0
                                ? ` ${info.tags.join(", ")}`
                                : ""}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleReplace(file.id)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      Replace
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-indigo-700 flex items-start space-x-1">
              <InfoIcon className="w-[14px] h-[14px] mt-1" />
              <span className="block max-w-[360px]">
                Uploaded documents will be automatically processed into the chatbot knowledge base.
              </span>
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-md"
            >
              Save & Process
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg animate-bounce">
          Uploaded files have been processed successfully.
        </div>
      )}

      {showInfoModal && (
        <InformationModal
          onClose={() => setShowInfoModal(false)}
          selectedFiles={files.filter((f) => selectedFiles.includes(f.id))}
          existingInfo={fileInfo}
          onSave={(updated) => setFileInfo(updated)}
        />
      )}
    </div>
  );
};

export default UploadModal;
