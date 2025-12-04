import React, { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import type { CreateUserDialogProps, CreateUserDialogPayload } from '@/interfaces/create-user-dialog'

const initialFormState: CreateUserDialogPayload = {
  username: '',
  email: '',
  password: '',
  role: 'staff',
  campus: 'HN',
  phone: ''
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onClose, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<CreateUserDialogPayload>(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // State điều khiển việc mở rộng form
  const [isExpanded, setIsExpanded] = useState(false)

  // Ref lưu thời điểm vừa Focus (mở menu)
  const focusTimeRef = useRef<number>(0)

  useEffect(() => {
    if (open) {
      setFormData(initialFormState)
      setErrors({})
      setIsExpanded(false)
      focusTimeRef.current = 0
    }
  }, [open])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.username.trim()) newErrors.username = 'Username is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  const handleChange = (field: keyof CreateUserDialogPayload, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field])
      setErrors(prev => {
        const newErr = { ...prev }
        delete newErr[field]
        return newErr
      })
  }

  // 1. Xử lý khi chọn giá trị MỚI (onChange luôn chạy)
  const handleCampusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange('campus', e.target.value)
    e.target.blur() // Blur ngay để đóng form
  }

  // 2. Xử lý khi chọn lại giá trị CŨ hoặc bấm tắt (onChange không chạy, onClick sẽ chạy)
  const handleCampusClick = (e: React.MouseEvent<HTMLSelectElement>) => {
    const now = Date.now()
    // Nếu từ lúc Focus đến lúc Click > 200ms -> Đây là hành động chọn/tắt -> Blur để đóng
    if (now - focusTimeRef.current > 200) {
      e.currentTarget.blur()
    }
  }

  const FormInput = ({
    id,
    label,
    type = 'text',
    required = false
  }: {
    id: keyof CreateUserDialogPayload
    label: string
    type?: string
    required?: boolean
  }) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        id={id}
        type={type}
        value={formData[id]}
        disabled={loading}
        error={!!errors[id]}
        placeholder={`Enter ${label.toLowerCase()}`}
        onChange={e => handleChange(id, e.target.value)}
      />
      {errors[id] && <span className="text-xs text-red-500">{errors[id]}</span>}
    </div>
  )

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Create New User</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
          <FormInput id="username" label="Username" required />
          <FormInput id="email" label="Email" type="email" required />
          <FormInput id="phone" label="Phone Number" />
          <FormInput id="password" label="Password" type="password" required />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="role" className="text-sm font-medium text-slate-700">
                Role
              </label>
              <Select
                id="role"
                value={formData.role}
                onChange={e => handleChange('role', e.target.value)}
                disabled={loading}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="campus" className="text-sm font-medium text-slate-700">
                Campus
              </label>
              <Select
                id="campus"
                value={formData.campus}
                onChange={handleCampusChange}
                disabled={loading}
                // Logic mở rộng/thu hẹp:
                onFocus={() => {
                  setIsExpanded(true)
                  focusTimeRef.current = Date.now() // Lưu thời điểm bắt đầu mở
                }}
                onClick={handleCampusClick} // Xử lý click chọn lại giá trị cũ
                onBlur={() => {
                  setIsExpanded(false)
                  focusTimeRef.current = 0
                }}
              >
                <option value="HN">Hà Nội</option>
                <option value="HCM">Hồ Chí Minh</option>
                <option value="DN">Đà Nẵng</option>
                <option value="CT">Cần Thơ</option>
              </Select>
            </div>
          </div>

          <div
            className="w-full transition-all duration-120 ease-in-out"
            style={{ height: isExpanded ? '100px' : '0px' }}
          ></div>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={loading} type="button">
          Cancel
        </Button>
        <Button
          form="create-user-form"
          type="submit"
          disabled={loading}
          className="bg-[#003087] text-white hover:bg-[#002060]"
        >
          {loading ? 'Creating...' : 'Create User'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
