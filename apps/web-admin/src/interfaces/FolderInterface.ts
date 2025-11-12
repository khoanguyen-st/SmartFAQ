export interface IKnowledgeFolder {
    id: number;
    title: string;
    date: string;
    sources: number; 
}

export interface DocumentCardProps {
    doc: IKnowledgeFolder; 
    onDelete: (doc: IKnowledgeFolder) => void; 
    onView: (doc: IKnowledgeFolder) => void; 
    onReupload: (doc: IKnowledgeFolder) => void;
    onSelect: (doc: IKnowledgeFolder) => void; 
}