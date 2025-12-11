import eyeOff from '@/assets/icons/eye-off.svg'
import eye from '@/assets/icons/eye.svg'
import { ChangePasswordRequest, changePassword } from '@/services/user.services'
import React, { useState } from 'react'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number
}

interface ErrorState {
  current_password?: string
  new_password?: string
  confirm_password?: string
  general?: string
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, userId }) => {
  const initialFormData = {
    current_password: '',
    new_password: '',
    confirm_password: ''
  }

  const [formData, setFormData] = useState<ChangePasswordRequest>(initialFormData)

  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [errors, setErrors] = useState<ErrorState>({})
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleCancel = () => {
    setFormData(initialFormData)
    setErrors({})
    setShowPass({ current: false, new: false, confirm: false })
    onClose()
  }

  const toggleShow = (field: keyof typeof showPass) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const validatePassword = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return regex.test(pass)
  }

  // --- LOGIC REAL-TIME HANDLER ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => {
      // Tính toán state tiếp theo để validate chính xác
      const nextState = { ...prev, [name]: value }
      
      const newErrors: ErrorState = { ...errors }
      delete newErrors.general 

      // 1. Validate New Password khi đang gõ
      if (name === 'new_password') {
        // Kiểm tra Regex
        if (value && !validatePassword(value)) {
           // Chỉ hiện lỗi khi đã nhập gì đó
           newErrors.new_password = 'Password must be 8+ chars, with upper, lower, number & special char.'
        } else {
           delete newErrors.new_password
        }

        // Kiểm tra đối chiếu với Confirm Password
        if (nextState.confirm_password) {
          if (nextState.confirm_password !== value) {
            newErrors.confirm_password = 'Passwords do not match'
          } else {
            delete newErrors.confirm_password
          }
        }
      }

      // 2. Validate Confirm Password khi đang gõ
      if (name === 'confirm_password') {
        if (value && value !== nextState.new_password) {
          newErrors.confirm_password = 'Passwords do not match'
        } else {
          delete newErrors.confirm_password
        }
      }

      if (name === 'current_password') {
        delete newErrors.current_password
      }

      setErrors(newErrors)
      return nextState
    })
  }
  // ------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Vẫn giữ validate lúc submit để chặn trường hợp user bypass client script
    // hoặc chưa nhập gì mà bấm submit
    const newErrors: ErrorState = {}
    let hasError = false

    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
      hasError = true
    }

    if (!validatePassword(formData.new_password)) {
      newErrors.new_password = 'Password must be 8+ chars, with upper, lower, number & special char.'
      hasError = true
    }

    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required'
      hasError = true
    }

    if (hasError) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      await changePassword(userId, formData)
      alert('Password changed successfully!')
      handleCancel()
    } catch (err: unknown) {
      let msg = 'Failed to change password'
      if (err instanceof Error) msg = err.message
      else if (typeof err === 'string') msg = err

      if (msg.toLowerCase().includes('current password')) {
        setErrors({ current_password: msg })
      } else if (msg.toLowerCase().includes('security requirements')) {
        setErrors({ new_password: msg })
      } else {
        setErrors({ general: msg })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const renderInputRow = (
    label: string,
    name: keyof ChangePasswordRequest,
    isShow: boolean,
    toggleField: keyof typeof showPass,
    placeholderText: string,
    marginTopClass: string
  ) => {
    const fieldError = errors[name]

    return (
      <div className={`flex flex-col gap-2.5 ${marginTopClass}`}>
        <label className="text-[16px] leading-6 font-medium text-[#111928]">
          {label} <span className="ml-1 text-red-500">*</span>
        </label>

        <div className="relative w-[574px]">
          <input
            type={isShow ? 'text' : 'password'}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholderText}
            className={`h-[46px] w-full rounded-xl border bg-white pr-10 pl-5 text-[16px] transition-colors outline-none ${
              fieldError
                ? 'border-red-500 text-red-500 placeholder-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-[#6B7280] text-[#111928] placeholder-[#9CA3AF] focus:border-[#003087] focus:ring-1 focus:ring-[#003087]'
            } `}
          />

          <button
            type="button"
            onClick={() => toggleShow(toggleField)}
            className={`absolute top-1/2 right-4 flex -translate-y-1/2 items-center justify-center ${fieldError ? 'text-red-500' : 'text-[#111928]'}`}
          >
            <img
              src={isShow ? eye : eyeOff}
              alt="toggle visibility"
              className={`h-6 w-6 brightness-0 ${fieldError ? 'brightness-50 hue-rotate-340 saturate-5000 sepia' : ''}`}
            />
          </button>
        </div>

        {/* --- Transition cho Error Message --- */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            fieldError ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0'
          }`}
        >
          <div className="overflow-hidden">
            <p className="text-sm text-red-500">{fieldError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative h-auto min-h-150 w-[698px] rounded-2xl bg-white">
        <div className="pt-[45px] pl-[68px]">
          <h2 className="mb-2 text-3xl font-bold text-slate-900">Change Password</h2>
          <p className="text-base text-slate-600">Secure your account with a new password.</p>

          <form onSubmit={handleSubmit}>
            {errors.general && (
              <div className="mt-4 w-[574px] rounded-lg bg-red-50 p-3 text-sm text-red-500">{errors.general}</div>
            )}

            {renderInputRow(
              'Current password',
              'current_password',
              showPass.current,
              'current',
              'Enter current password',
              errors.general ? 'mt-[20px]' : 'mt-[40px]'
            )}

            {renderInputRow('New password', 'new_password', showPass.new, 'new', 'Enter new password', 'mt-[25px]')}

            {renderInputRow(
              'Confirm password',
              'confirm_password',
              showPass.confirm,
              'confirm',
              'Confirm new password',
              'mt-[20px]'
            )}

            <div className="flex w-full justify-end p-6 gap-6 pr-[56px]">
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-12 w-30 items-center justify-center rounded-2xl border-2 border-[#F3F4F6] bg-white text-[16px] font-medium text-black transition-all duration-200 ease-in-out hover:bg-gray-50 shadow-lg hover:scale-102"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-30 items-center justify-center rounded-2xl bg-[#003087] text-[16px] font-medium text-white transition-all duration-200 ease-in-out hover:bg-[#00205a] disabled:opacity-70 shadow-lg hover:scale-102"
              >
                {isLoading ? '...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordModal