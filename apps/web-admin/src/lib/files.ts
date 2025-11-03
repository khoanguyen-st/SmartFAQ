export const MAX_FILES = 20;
export const MAX_SIZE = 25 * 1024 * 1024;

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

  const valid = files.filter((f) => f.size <= MAX_SIZE);
  if (valid.length < files.length) {
    return { valid, error: "Some files were rejected (max 25MB each)." };
  }

  return { valid, error: null };
};
