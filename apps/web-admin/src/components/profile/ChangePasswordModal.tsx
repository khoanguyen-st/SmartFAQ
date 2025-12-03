import eyeOffUrl from '@/assets/icons/eye-off.svg'
import eyeUrl from '@/assets/icons/eye.svg'
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (errors[name as keyof ErrorState] || errors.general) {
      setErrors(prev => ({ ...prev, [name]: undefined, general: undefined }))
    }
  }

  const validatePassword = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return regex.test(pass)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    let hasError = false
    const newErrors: ErrorState = {}

    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
      newErrors.new_password = 'Passwords do not match'
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

      if (err instanceof Error) {
        msg = err.message
      } else if (typeof err === 'string') {
        msg = err
      }

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
          {label} <span className="ml-1 text-[#E02424]">*</span>
        </label>

        <div className="relative w-[574px]">
          <input
            type={isShow ? 'text' : 'password'}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholderText}
            className={`h-[46px] w-full rounded-md border bg-white pr-10 pl-5 text-[16px] transition-colors outline-none ${
              fieldError
                ? 'border-[#E02424] text-[#E02424] placeholder-red-300 focus:border-[#E02424] focus:ring-1 focus:ring-[#E02424]'
                : 'border-[#6B7280] text-[#111928] placeholder-[#9CA3AF] focus:border-[#003087] focus:ring-1 focus:ring-[#003087]'
            } `}
          />

          <button
            type="button"
            onClick={() => toggleShow(toggleField)}
            className={`absolute top-1/2 right-4 flex -translate-y-1/2 items-center justify-center ${fieldError ? 'text-[#E02424]' : 'text-[#111928]'}`}
          >
            <img
              src={isShow ? eyeUrl : eyeOffUrl}
              alt="toggle visibility"
              className={`h-6 w-6 brightness-0 ${fieldError ? 'brightness-50 hue-rotate-340 saturate-5000 sepia' : ''}`}
            />
          </button>
        </div>

        {fieldError && <p className="text-sm text-[#E02424]">{fieldError}</p>}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative h-auto min-h-[629px] w-[698px] rounded-[20px] bg-white pb-8 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <div className="pt-[45px] pl-[68px]">
          <h2 className="text-[30px] leading-[38px] font-bold text-black">Change Password</h2>

          <p className="mt-6 text-[18px] leading-[26px] font-medium text-[#637381]">
            Secure your account with a new password.
          </p>

          <form onSubmit={handleSubmit}>
            {errors.general && (
              <div className="mt-4 w-[574px] rounded-lg bg-red-50 p-3 text-sm text-[#E02424]">{errors.general}</div>
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

            <div className="mt-[49px] flex w-[574px] justify-end gap-[21px]">
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-[64.45px] w-[120px] items-center justify-center rounded-[50px] border-2 border-[#F3F4F6] bg-white text-[16px] font-medium text-black transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-[64.45px] w-[124px] items-center justify-center rounded-[50px] bg-[#003087] text-[16px] font-medium text-white transition hover:bg-[#00205a] disabled:opacity-70"
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
