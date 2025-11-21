import warningUrl from "@/assets/icons/warning.svg";
import React from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    documentTitle: string;
    onCancel: () => void;
    onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    documentTitle,
    onCancel,
    onConfirm
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="flex flex-col items-center mb-6">
                    <div className="bg-red-100 p-3 rounded-full mb-4">
                        <img src={warningUrl} alt="warning" className="h-6 w-6 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Delete Document?</h2>
                </div>
                <div className="text-center mb-8">
                    <p className="text-gray-600">
                        You are about to delete 1 document named: "{documentTitle}".
                        <span className="font-semibold text-red-600 block mt-1">
                            This action cannot be undone. Do you want to continue?
                        </span>
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                    >
                        Delete Document
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
