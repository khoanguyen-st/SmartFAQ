import warningUrl from '@/assets/icons/warning.svg'

interface DeleteDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  departmentName: string
  isLoading?: boolean
}

const DeleteDepartmentModal = ({
  isOpen,
  onClose,
  onConfirm,
  departmentName,
  isLoading
}: DeleteDepartmentModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative h-[375px] w-[624px] rounded-[10px] bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-[50px] left-[282px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#FFECEC]">
          <img
            src={warningUrl}
            alt="warning"
            className="h-[30px] w-[30px]"
            style={{
              filter: 'invert(52%) sepia(82%) saturate(3626%) hue-rotate(331deg) brightness(100%) contrast(101%)'
            }}
          />
        </div>

        <h2 className="absolute top-[130px] w-full text-center text-[18px] leading-[26px] font-semibold text-black">
          Delete Department?
        </h2>

        <p className="absolute top-44 left-[57.5px] w-[509px] text-center font-sans text-[16px] leading-6 font-medium text-[#637381]">
          You are about to delete <span className="font-bold text-black">"{departmentName}"</span>. <br />
          This action cannot be undone. Do you want to continue?
        </p>

        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-[266px] left-[103px] h-[50px] w-[198px] rounded-[50px] border border-[#DFE4EA] bg-white text-[16px] font-medium text-black hover:bg-gray-50 disabled:opacity-70"
        >
          Cancel
        </button>

        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="absolute top-[266px] left-[323px] h-[50px] w-[198px] rounded-[50px] bg-[#C20B0B] text-[16px] font-medium text-white hover:bg-[#a00909] disabled:opacity-70"
        >
          {isLoading ? 'Deleting...' : 'Delete Document'}
        </button>
      </div>
    </div>
  )
}

export default DeleteDepartmentModal
