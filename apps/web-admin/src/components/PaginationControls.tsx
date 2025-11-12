import { ArrowRight, ArrowLeft } from 'lucide-react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    goToPage: (page: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage
}) => {
    if (totalPages <= 1) return null;
    
    return (
        <div className="flex justify-center items-center gap-2 mt-4">
            <button
                onClick={goToPreviousPage}
                disabled={!hasPreviousPage}
                className="p-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
                <ArrowLeft />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                <button
                    key={page}
                    onClick={() => goToPage(page)}
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
                onClick={goToNextPage}
                disabled={!hasNextPage}
                className="p-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
                <ArrowRight />
            </button>
        </div>
    );
};

export default PaginationControls;