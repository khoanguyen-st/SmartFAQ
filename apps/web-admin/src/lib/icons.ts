export const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
  
    switch (ext) {
      case "pdf":
        return "/src/assets/icons/pdf.svg";
      case "docx":
        return "/src/assets/icons/docx.svg";
      case "txt":
        return "/src/assets/icons/txt.svg";
      case "md":
      case "markdown":
        return "/src/assets/icons/md.svg";
      default:
        return "/src/assets/icons/file.svg"; // fallback
    }
  };