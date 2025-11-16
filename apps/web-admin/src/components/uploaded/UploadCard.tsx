import { Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface UploadCardProps {
  onClick: () => void
}

const UploadCard = ({ onClick }: UploadCardProps) => {
  const { t } = useI18n()

  return (
    <div
      onClick={onClick}
      className="flex h-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:bg-gray-50"
    >
      <div className="mb-3 rounded-full bg-blue-100 p-3">
        <Plus className="h-5 w-5 text-blue-600" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{t('uploadNewDocument')}</p>
      <p className="mt-1 text-xs text-gray-500">{t('addPdfFiles')}</p>
    </div>
  )
}

export default UploadCard
