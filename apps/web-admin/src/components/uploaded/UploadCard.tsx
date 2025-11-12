import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import React from 'react';

interface UploadCardProps {
    onClick: () => void; 
}

const UploadCard = ({ onClick }: UploadCardProps) => {
    const { t } = useTranslation();
    
    return (
        <div 
            onClick={onClick}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg text-center h-full 
                      cursor-pointer hover:bg-gray-50 transition-colors"
        >
            <div className="bg-blue-100 p-3 rounded-full mb-3">
                <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
                {t('folder.title')} 
            </p>         
            <p className="text-xs text-gray-500 mt-1">
                {t('folder.subtitle')} 
            </p>
        </div>
    );
};

export default UploadCard;