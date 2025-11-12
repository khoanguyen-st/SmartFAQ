import { useState, useMemo, useCallback } from 'react';
import { PlusIcon } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IKnowledgeFolder } from '@/interfaces/FolderInterface';
import { useSortFolders } from "@/hooks/useSortFolders";
import { STORAGE_KEYS, AppRoutes } from '@/constants/routes';
import useResponsiveItemsPerPage from '@/hooks/useResponsiveItemsPerPage';
import useGridPlaceholders from "@/hooks/useGridPlaceholders";
import PaginationControls from '@/components/PaginationControls';
import usePagination from "@/hooks/usePagination";
import FolderCard from "@/components/uploaded/FolderCard";
import UploadCard from "@/components/uploaded/UploadCard";
import DeleteConfirmationModal from "@/components/uploaded/DeleteConfirmationModal";

const MOCK_FOLDERS: IKnowledgeFolder[] = [
    { id: 1, title: "Student Admission Guidelines 2024", date: "Oct 29, 2024", sources: 3 },
    { id: 2, title: "Financial Aid Application Process", date: "Nov 30, 2024", sources: 5 },
];

const UploadedPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [folders, setFolders] = useState<IKnowledgeFolder[]>(MOCK_FOLDERS);
    const [folderToDelete, setFolderToDelete] = useState<IKnowledgeFolder | null>(null);
    const sortedFolders = useSortFolders(folders);
    const itemsPerPage = useResponsiveItemsPerPage();

    const {
        currentPage,
        totalPages,
        currentItems: currentFolders,
        goToPage,
        goToNextPage,
        goToPreviousPage,
        hasNextPage,
        hasPreviousPage,
        setCurrentPage
    } = usePagination({
        items: sortedFolders,
        itemsPerPage,
    });

    const onUploadClick = () => {
        // TODO: Implement upload logic
    };

    const handleOpenDeleteModal = useCallback((folder: IKnowledgeFolder) => {
        setFolderToDelete(folder);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        setFolderToDelete(null);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (folderToDelete) {
            setFolders(prev => prev.filter(folder => folder.id !== folderToDelete.id));
        }
        handleCloseDeleteModal();
    }, [folderToDelete, handleCloseDeleteModal]);

    const handleViewFolder = useCallback((folder: IKnowledgeFolder) => {
        localStorage.setItem(STORAGE_KEYS.SELECTED_FOLDER_ID, folder.id.toString());
        navigate(AppRoutes.VIEW_CHAT);
    }, [navigate]);

    const handleReuploadFolder = useCallback((folder: IKnowledgeFolder) => {
    }, []);

    const placeholders = useGridPlaceholders({
        totalItems: sortedFolders.length,
        currentPageItems: currentFolders.length,
        currentPage,
        totalPages,
        hasUploadCard: true
    });

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
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {t('folder.noFoldersUploaded')}
            </h3>
            <p className="text-gray-500 mb-6">
                {t('folder.startUploading')}
            </p>
            <UploadCard onClick={onUploadClick} />
        </div>
    ) : (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {currentPage === 1 && (
                    <UploadCard onClick={onUploadClick} />
                )}

                {currentFolders.map(folder => (
                    <FolderCard
                        key={folder.id}
                        doc={folder} 
                        onDelete={handleOpenDeleteModal}
                        onSelect={handleViewFolder}
                        onView={handleViewFolder}
                        onReupload={handleReuploadFolder}
                    />
                ))}

                {placeholders.map(key => (
                    <div key={key} className="opacity-0 pointer-events-none">
                        <FolderCard
                            doc={{ id: key, title: "Placeholder", date: "", sources: 0 } as IKnowledgeFolder} // Đã loại bỏ 'as any'
                            onDelete={() => { }}
                            onView={() => { }}
                            onReupload={() => { }}
                            onSelect={() => { }}
                        />
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    goToPage={goToPage}
                    goToNextPage={goToNextPage}
                    goToPreviousPage={goToPreviousPage}
                    hasNextPage={hasNextPage}
                    hasPreviousPage={hasPreviousPage}
                />
            )}
        </div>
    );

    return (
        <div className="mx-5 mt-6">
            <div className="px-4 flex justify-between items-center">
                <div className="hidden sm:block">
                    <h2 className="text-2xl font-semibold mb-2">
                        {t('folder.knowledgeFolders')}
                    </h2>
                    <p className="text-gray-600 mb-4">
                        {t('folder.manageAndReview')}
                    </p>
                </div>

                <div>
                    <button
                        onClick={onUploadClick}
                        className="bg-[#003087] hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer sm:min-w-[150px]"
                    >
                        <PlusIcon className='h-4 w-4'/>
                        <span className="hidden sm:block">
                            {t('folder.uploadNewFolder')}
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