import { useState, useMemo, useCallback, useEffect } from 'react';
import DocumentCard from "../components/uploaded/DocumentCard";
import UploadCard from "../components/uploaded/UploadCard";
import PlusIcon from "../assets/icon/plus.svg?react";
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from "../components/uploaded/DeleteConfirmationModal";

interface IKnowledgeFolder {
        id: number;
        title: string;
        date: string;
        sources: number;
}

const MOCK_FOLDERS: IKnowledgeFolder[] = [
        { id: 1, title: "Student Admission Guidelines 2024", date: "Oct 29, 2024", sources: 3 },
        { id: 2, title: "Financial Aid Application Process", date: "Oct 28, 2024", sources: 5 },
];

const sortFolders = (folders: IKnowledgeFolder[]): IKnowledgeFolder[] => {
        return folders.slice().sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();

                return dateB - dateA;
        });
};

const getMaxDocsPerPage = () => {
        if (typeof window === 'undefined') return 3;
        if (window.innerWidth >= 1280) {
                return 10;
        } else if (window.innerWidth >= 1024) {
                return 8;
        } else {
                return 3;
        }
};

const SELECTED_DOC_KEY = 'selectedKnowledgeFolderId';

const UploadedPage = () => {
        const navigate = useNavigate();
        const [folders, setFolders] = useState<IKnowledgeFolder[]>(MOCK_FOLDERS);
        const [folderToDelete, setFolderToDelete] = useState<IKnowledgeFolder | null>(null);
        const [currentPage, setCurrentPage] = useState(1);
        const [docsPerPage, setDocsPerPage] = useState(getMaxDocsPerPage());

        useEffect(() => {
                const handleResize = () => {
                        setDocsPerPage(getMaxDocsPerPage());
                        setCurrentPage(1);
                };

                window.addEventListener('resize', handleResize);
                return () => window.removeEventListener("resize", handleResize);
        }, []);

        const onUploadClick = () => {

        };

        const handleOpenDeleteModal = useCallback((folder: IKnowledgeFolder) => {
                setFolderToDelete(folder);
        }, []);

        const handleCloseDeleteModal = useCallback(() => {
                setFolderToDelete(null);
        }, []);

        const handleConfirmDelete = useCallback(() => {
                if (folderToDelete) {
                        console.log(`[ACTION] CONFIRMED Deleting folder ID: ${folderToDelete.id} - ${folderToDelete.title}`);
                        setFolders(prev => prev.filter(folder => folder.id !== folderToDelete.id));
                }

                const newTotalPages = Math.ceil((folders.length - 1) / docsPerPage);
                if (currentPage > newTotalPages && newTotalPages > 0) {
                        setCurrentPage(newTotalPages);
                } else if (newTotalPages === 0) {
                        setCurrentPage(1);
                }

                handleCloseDeleteModal();
        }, [folderToDelete, handleCloseDeleteModal, folders.length, docsPerPage, currentPage]);

        const handleViewFolder = useCallback((folder: IKnowledgeFolder) => {
                console.log(`[ACTION] Navigating to chat view for folder: ${folder.title}`);

                localStorage.setItem(SELECTED_DOC_KEY, folder.id.toString());
                navigate(`/view-chat`);
        }, [navigate]);

        const handleReuploadFolder = useCallback((folder: IKnowledgeFolder) => console.log(`Re-upload documents in folder ${folder.title}`), []);


        const sortedFolders = useMemo(() => {
                return sortFolders(folders);
        }, [folders]);

        const totalPages = Math.ceil(sortedFolders.length / docsPerPage);
        const startIndex = (currentPage - 1) * docsPerPage;

        let currentFolders = sortedFolders.slice(startIndex, startIndex + docsPerPage);
        let placeholders: number[] = [];

        const isLastPage = currentPage === totalPages;

        if (isLastPage && sortedFolders.length > 0) {
                const DOCUMENTS_PER_ROW =
                        window.innerWidth >= 1280 ? 5 :
                                window.innerWidth >= 1024 ? 4 :
                                        window.innerWidth >= 640 ? 2 : 1;

                const MAX_ROWS = 2;
                const maxItemsOnGrid = MAX_ROWS * DOCUMENTS_PER_ROW;

                const itemsOnPage = currentPage === 1 ? currentFolders.length + 1 : currentFolders.length;

                const emptySlots = maxItemsOnGrid - itemsOnPage;

                if (emptySlots > 0) {
                        placeholders = Array.from({ length: emptySlots }, (_, i) => -(i + 1));
                }
        }

        const handlePageChange = useCallback((page: number) => {
                if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                }
        }, [totalPages]);

        const isFolderEmpty = sortedFolders.length === 0;

        const modalProps = useMemo(() => {
                if (folderToDelete) {
                        return {
                                isOpen: true,
                                documentTitle: folderToDelete.title,
                                onCancel: handleCloseDeleteModal,
                                onConfirm: handleConfirmDelete,
                        };
                }
                return { isOpen: false, documentTitle: '' } as const;
        }, [folderToDelete, handleCloseDeleteModal, handleConfirmDelete]);


        const content = isFolderEmpty ? (
                <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 h-64">
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Knowledge Folders uploaded yet.</h3>
                        <p className="text-gray-500 mb-6">Start by uploading your first folder to train the SmartFAQ system.</p>
                        <UploadCard onClick={onUploadClick} />
                </div>
        ) : (
                <div className="flex flex-col gap-6">

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

                                {currentPage === 1 && (
                                        <UploadCard onClick={onUploadClick} />
                                )}

                                {currentFolders.map(folder => (
                                        <DocumentCard
                                                key={folder.id}
                                                doc={folder as any}
                                                onDelete={handleOpenDeleteModal}
                                                onSelect={handleViewFolder}
                                                onView={handleViewFolder}
                                                onReupload={handleReuploadFolder}
                                        />
                                ))}

                                {placeholders.map(key => (
                                        <div key={key} className="opacity-0 pointer-events-none">
                                                <DocumentCard
                                                        doc={{ id: key, title: "Placeholder", date: "", sources: 0 } as IKnowledgeFolder as any}
                                                        onDelete={() => { }}
                                                        onView={() => { }}
                                                        onReupload={() => { }}
                                                        onSelect={() => { }}
                                                />
                                        </div>
                                ))}

                        </div>

                        {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-4">
                                        <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="p-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                                <ArrowLeft />
                                        </button>

                                        {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                                                <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${page === currentPage
                                                                        ? 'bg-[#003087] text-white'
                                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                                                }`}
                                                >
                                                        {page}
                                                </button>
                                        ))}

                                        <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="p-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                                <ArrowRight />
                                        </button>
                                </div>
                        )}
                </div>
        );

        return (
                <div className="mx-5 mt-6">
                        <div className="px-4 flex justify-between items-center">
                                <div className="hidden sm:block">
                                        <h2 className="text-2xl font-semibold mb-2">Knowledge Folders</h2>
                                        <p className="text-gray-600 mb-4">Manage and review the folders you have uploaded to the SmartFAQ system.</p>
                                </div>

                                <div>
                                        <button
                                                onClick={onUploadClick}
                                                className="bg-[#003087] hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer sm:min-w-[150px]" >
                                                <PlusIcon />
                                                <span className="hidden sm:block">
                                                        Upload New Folder
                                                </span>
                                        </button>
                                </div>
                        </div>
                        <div className="m-3">
                                {content}
                        </div>

                        {modalProps.isOpen && (
                                <DeleteConfirmationModal
                                        isOpen={modalProps.isOpen}
                                        documentTitle={modalProps.documentTitle}
                                        onCancel={modalProps.onCancel}
                                        onConfirm={modalProps.onConfirm}
                                />
                        )}
                </div>
        );
};
export default UploadedPage;