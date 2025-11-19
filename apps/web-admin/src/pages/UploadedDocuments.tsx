import { useState, useMemo, useCallback, useEffect } from 'react';
import DocumentCard from "../components/uploaded/DocumentCard";
import UploadCard from "../components/uploaded/UploadCard";
import PlusIcon from "../assets/icon/plus.svg?react";
import { ArrowRight, ArrowLeft } from 'lucide-react';
import DeleteConfirmationModal from "../components/uploaded/DeleteConfirmationModal"; 


interface IDocument {
    id: number;
    title: string;
    date: string;
    sources: number;
}

const MOCK_DOCUMENTS: IDocument[] = [
    { id: 1, title: "Student Admission Guidelines 2024", date: "Oct 29, 2024", sources: 3 },
    { id: 2, title: "Financial Aid Application Process", date: "Oct 28, 2024", sources: 5 },
    { id: 3, title: "Course Registration Deadlines", date: "Oct 27, 2024", sources: 2 },
    { id: 4, title: "Student Housing Policies and Procedures", date: "Oct 26, 2024", sources: 4 },
    { id: 5, title: "Academic Calendar 2024-2025", date: "Oct 25, 2024", sources: 1 },
    { id: 6, title: "Student Code of Conduct", date: "Oct 24, 2024", sources: 6 },
    { id: 7, title: "Exam Schedule Spring 2025", date: "Oct 23, 2024", sources: 2 },
    { id: 8, title: "IT Service Guide", date: "Oct 22, 2024", sources: 7 },
];

const sortDocuments = (docs: IDocument[]): IDocument[] => {
    return docs.slice().sort((a, b) => {
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


const UploadedPage = () => {
    const [documents, setDocuments] = useState<IDocument[]>(MOCK_DOCUMENTS);
    const [documentToDelete, setDocumentToDelete] = useState<IDocument | null>(null);
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

    const handleOpenDeleteModal = useCallback((doc: IDocument) => {
        setDocumentToDelete(doc); 
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        setDocumentToDelete(null);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (documentToDelete) {
            setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id));
        }
        
        const newTotalPages = Math.ceil((documents.length - 1) / docsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        } else if (newTotalPages === 0) {
            setCurrentPage(1);
        }
        
        handleCloseDeleteModal(); 
    }, [documentToDelete, handleCloseDeleteModal, documents.length, docsPerPage, currentPage]);

    const handleViewDocument = useCallback((doc: IDocument) => {
        // TODO: Implement view document functionality
        void doc;
    }, []);
    const handleReuploadDocument = useCallback((doc: IDocument) => {
        // TODO: Implement reupload document functionality
        void doc;
    }, []);


    const sortedDocuments = useMemo(() => {
        return sortDocuments(documents); 
    }, [documents]);
    
    const totalPages = Math.ceil(sortedDocuments.length / docsPerPage); 
    const startIndex = (currentPage - 1) * docsPerPage;
    
    let currentDocuments = sortedDocuments.slice(startIndex, startIndex + docsPerPage);
    let placeholders: number[] = [];
    
    const isLastPage = currentPage === totalPages;
    
    if (isLastPage && sortedDocuments.length > 0) {
        const DOCUMENTS_PER_ROW = 
            window.innerWidth >= 1280 ? 5 : 
            window.innerWidth >= 1024 ? 4 : 
            window.innerWidth >= 640 ? 2 : 1;
            
        const MAX_ROWS = 3; 
        const maxItemsOnGrid = MAX_ROWS * DOCUMENTS_PER_ROW; 
        
        const itemsOnPage = currentPage === 1 ? currentDocuments.length + 1 : currentDocuments.length;
        
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
    
    const isDocumentEmpty = sortedDocuments.length === 0;

    const modalProps = useMemo(() => {
        if (documentToDelete) {
            return {
                isOpen: true,
                documentTitle: documentToDelete.title,
                onCancel: handleCloseDeleteModal,
                onConfirm: handleConfirmDelete, 
            };
        }
        return { isOpen: false, documentTitle: '' } as const;
    }, [documentToDelete, handleCloseDeleteModal, handleConfirmDelete]);


    const content = isDocumentEmpty ? (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 h-64">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No documents uploaded yet.</h3>
            <p className="text-gray-500 mb-6">Start by uploading your first document to train the SmartFAQ system.</p>
            <UploadCard onClick={onUploadClick} />
        </div>
    ) : (
        <div className="flex flex-col gap-6"> 
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

                {currentPage === 1 && (
                    <UploadCard onClick={onUploadClick} />
                )}

                {currentDocuments.map(doc => (
                    <DocumentCard
                        key={doc.id}
                        doc={doc as unknown as { id: number; title: string; date: string; sources: number }}
                        onDelete={handleOpenDeleteModal} 
                        onView={handleViewDocument}
                        onReupload={handleReuploadDocument}
                    />
                ))}
                
                {placeholders.map(key => (
                    <div key={key} className="opacity-0 pointer-events-none">
                        <DocumentCard
                            doc={{ id: key, title: "Placeholder", date: "", sources: 0 } as IDocument}
                            onDelete={() => {}} 
                            onView={() => {}}
                            onReupload={() => {}}
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
                        <ArrowLeft/>
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                                page === currentPage 
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
                <div className= "hidden sm:block">
                    <h2 className="text-2xl font-semibold mb-2">Uploaded Documents</h2>
                    <p className="text-gray-600 mb-4">Manage and review the documents you have uploaded to the SmartFAQ system.</p>
                </div>

                <div>
                    <button
                        onClick={onUploadClick}
                        className="bg-[#003087] hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer sm:min-w-[150px]" >
                        <PlusIcon />
                        <span className="hidden sm:block">
                            Upload New Document
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