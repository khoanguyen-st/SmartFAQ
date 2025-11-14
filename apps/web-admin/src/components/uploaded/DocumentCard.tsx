import React, { useState, useRef, useEffect, useCallback } from "react";
import { MoreVertical } from "lucide-react";
import PdfIcon from "@/assets/icons/pdf.svg?react";
import ReloadIcon from "@/assets/icons/reload.svg?react";
import TrashIcon from "@/assets/icons/trash.svg?react";
import ViewIcon from "@/assets/icons/view.svg?react";

interface IDocument {
    id: number;
    title: string;
    date: string;
    sources: number;
}

interface MenuItemProps {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
}

const MenuItem = ({ children, onClick, className = '' }: MenuItemProps) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer ${className}`}
    >
        {children}
    </button>
);

interface DocumentCardProps {
    doc: IDocument;
    onDelete: (doc: IDocument) => void;
    onView: (doc: IDocument) => void;
    onReupload: (doc: IDocument) => void;
}

const DocumentCard = ({ doc, onDelete, onView, onReupload }: DocumentCardProps) => {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
            default:
                console.warn(`Unknown action: ${actionType}`);
        }
    };

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    const handleToggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(prev => !prev);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer w-full ">
            <div className="flex justify-between items-start mb-3">
                <div className="bg-[#FEF2F2] p-2 rounded-xl"><PdfIcon className="text-red-500 h-6 w-6" /></div>

                <div className="relative " ref={menuRef}>
                    <button
                        onClick={handleToggleMenu}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 cursor-pointer"
                    >
                        <MoreVertical className="h-5 w-5" />
                    </button>

                    {isMenuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MenuItem onClick={() => handleAction('View')}><ViewIcon />View document</MenuItem>
                            <MenuItem onClick={() => handleAction('Re-upload')}> <ReloadIcon /> Re-upload</MenuItem>
                            <MenuItem
                                onClick={() => handleAction('Delete')}
                                className="text-red-600 hover:bg-red-50"
                            >
                                <TrashIcon />
                                Delete document
                            </MenuItem>
                        </div>
                    )}
                </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2">
                {doc.title}
            </h3>
            <div className="flex justify-between text-xs text-gray-500 mt-auto">
                <span>{doc.date}</span>
                <span>{doc.sources} sources</span>
            </div>
        </div>
    );
};
export default DocumentCard;