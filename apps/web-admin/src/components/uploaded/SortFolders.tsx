import type { IKnowledgeFolder } from "@/interfaces/IKnowledgeFolder";

export const sortFolders = (folders: IKnowledgeFolder[]) => {
  return folders.slice().sort((a, b) => {
    const dateA = new Date(a.createdAt ?? 0);
    const dateB = new Date(b.createdAt ?? 0);
    return dateB.getTime() - dateA.getTime();
  });
};
