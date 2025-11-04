export const MAX_FILES = 20;
export const MAX_SIZE = 10 * 1024 * 1024;

const allowedExtensions = [".pdf", ".docx", ".txt", ".md"];

export const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "text/plain",
  "text/markdown",
  "text/x-markdown",
];

export const formatBytes = (bytes: number) => {
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const mapFiles = (newFiles: File[]) => {
  return newFiles.map((f) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: f.name,
    size: f.size,
    progress: 100,
  }));
};

export const validateFiles = (
  files: File[],
  currentCount: number
): { valid: File[]; error: string | null } => {
  if (currentCount + files.length > MAX_FILES) {
    return { valid: [], error: `You can upload up to ${MAX_FILES} files only.` };
  }

 
  const sizeValid = files.filter((f) => f.size <= MAX_SIZE);
  if (sizeValid.length < files.length) {
    return { valid: sizeValid, error: "Some files were rejected (max 10MB each)." };
  }


  const typeValid = sizeValid.filter((f) => {
    const mimeOk = SUPPORTED_TYPES.includes(f.type);
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    const extOk = allowedExtensions.includes(ext);
    return mimeOk || extOk;
  });

  if (typeValid.length < sizeValid.length) {
    return { valid: typeValid, error: "Some files were rejected (unsupported file type)." };
  }

  return { valid: typeValid, error: null };
};


