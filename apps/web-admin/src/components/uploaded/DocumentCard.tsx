import React, { useState, useRef, useEffect, useCallback } from "react";
import {  MoreVertical } from "lucide-react";
import FolderIcon from "../../assets/icon/folder-open.svg?react";
import ReloadIcon from "../../assets/icon/reload.svg?react";
import TrashIcon from "../../assets/icon/trash.svg?react";
import ViewIcon from "../../assets/icon/view.svg?react";

interface IKnowledgeFolder {
    id: number;
    title: string;
    date: string;
    sources: number; 
}

interface DocumentCardProps {
    doc: IKnowledgeFolder; 
    onDelete: (doc: IKnowledgeFolder) => void; 
    onView: (doc: IKnowledgeFolder) => void; 
    onReupload: (doc: IKnowledgeFolder) => void;
    onSelect: (doc: IKnowledgeFolder) => void; 
}

const DocumentCard = ({ doc, onDelete, onView, onReupload, onSelect }: DocumentCardProps) => {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleMenu = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); 
        setIsMenuOpen(prev => !prev);
    }, []);

    const handleAction = (actionType: 'View' | 'Re-upload' | 'Delete') => {
        setIsMenuOpen(false); 
        switch (actionType) {
            case 'View':
                onView(doc); 
                break;
            case 'Re-upload':
                onReupload(doc);
                break;
            case 'Delete':
                onDelete(doc);
                break;
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleCardClick = (e: React.MouseEvent) => {
        if (menuRef.current && menuRef.current.contains(e.target as Node)) {
            return;
        }
        const target = e.target as HTMLElement;
        if (target.closest('button')) {
            return;
        }
        onSelect(doc);
    };

    return (
        <div 
            onClick={handleCardClick}
            className="
                bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer
                w-full aspect-[290/200] max-w-[300px] 
                flex flex-col justify-between 
            "
        >
            <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-[#e0ebfd] rounded-lg flex items-center justify-center shrink-0">
                    <FolderIcon/>
                </div>

                <div className="relative " ref={menuRef}>
                    <button 
                        onClick={toggleMenu}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                        aria-label="More options"
                    >
                        <MoreVertical/>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                            <button
                                onClick={() => handleAction('View')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <ViewIcon/>
                                View Chat
                            </button>
                            <button
                                onClick={() => handleAction('Re-upload')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <ReloadIcon/>
                                Re-upload
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                                onClick={() => handleAction('Delete')}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <TrashIcon/>
                                Delete Folder
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 min-h-[50px] flex items-center">
                <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                    {doc.title}
                </h3>
            </div>
            <div className="text-sm text-gray-500 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                        {doc.sources} Sources
                    </span>
                    <span>{doc.date}</span>
                </div>
            </div>
        </div>
    );
};
export default DocumentCard;