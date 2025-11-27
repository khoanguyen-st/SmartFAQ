import checkUrl from '@/assets/icons/checkmark.svg'
import closeUrl from '@/assets/icons/close.svg'
import eyeUrl from '@/assets/icons/eye.svg'
import warningUrl from '@/assets/icons/warning.svg'
import avatarDefaultUrl from '@/assets/icons/user-avatar.svg'
import ChangePasswordModal from '@/components/profile/ChangePasswordModal'
import { UserProfile } from '@/services/user.services'
import { useEffect, useRef, useState } from 'react'

const MOCK_USER: UserProfile = {
  username: 'nguyenan123',
  email: 'nguyenan123@example.com',
  phoneNumber: '02546987213',
  address: 'K03/4, Hai Ba Trung, Ha Noi, Viet Nam',
  image: null
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile>(MOCK_USER)

  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<keyof UserProfile | null>(null)
  const [tempValue, setTempValue] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const formFields: { label: string; key: keyof UserProfile; disabled?: boolean }[] = [
    { label: 'Email', key: 'email', disabled: true },
    { label: 'Username', key: 'username' },
    { label: 'Phone Number', key: 'phoneNumber' },
    { label: 'Address', key: 'address' }
  ]

  useEffect(() => {}, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setProfile(prev => ({ ...prev, image: objectUrl }))
    }
  }

  const handleDeleteImage = () => {
    if (profile.image) {
      setIsDeleteModalOpen(true)
    }
  }

  const confirmDeleteImage = () => {
    setProfile(prev => ({ ...prev, image: null }))
    setIsDeleteModalOpen(false)
  }

  const startEdit = (field: keyof UserProfile) => {
    setEditingField(field)
    setTempValue(String(profile[field] || ''))
  }

  const cancelEdit = () => {
    setEditingField(null)
    setTempValue('')
  }

  const saveEdit = () => {
    if (editingField) {
      setProfile(prev => ({ ...prev, [editingField]: tempValue }))
      setEditingField(null)
    }
  }

  const handleSeeDocuments = () => {
    alert('Navigating to documents page...')
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#F9FAFB] px-[100px] py-10">
      <div className="flex shrink-0 items-end justify-between">
        <div>
          <h2 className="text-[40px] leading-12 font-bold text-[#111827]">My Profile</h2>
          <p className="mt-1 text-[18px] leading-[26px] font-medium text-[#637381]">Summary of personal information</p>
        </div>

        <button
          onClick={handleSeeDocuments}
          className="flex h-10 w-[228px] items-center justify-center gap-2 rounded-lg bg-[#003087] text-[16px] font-medium text-white transition-colors hover:bg-[#00205a]"
        >
          <img src={eyeUrl} alt="view" className="h-6 w-6 brightness-0 invert" />
          See Your Documents
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center py-6">
        <div className="relative flex w-full max-w-[1535px] shrink-0 rounded-[20px] border-2 border-[#E5E7EB] bg-white p-12 shadow-sm xl:p-[100px]">
          <div className="flex w-full flex-row">
            <div className="mr-[164px] flex shrink-0 flex-col items-center">
              <div className="h-[303px] w-[303px] overflow-hidden rounded-full shadow-[0px_4px_5px_rgba(0,0,0,0.25)]">
                <img src={profile.image || avatarDefaultUrl} alt="Profile" className="h-full w-full object-cover" />
              </div>

              <div className="mt-11 flex w-[303px] justify-between">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-[145px] rounded-[50px] border-2 border-[#003087] text-[12px] font-medium text-[#003087] transition hover:bg-blue-50"
                >
                  Edit Image
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />

                <button
                  onClick={handleDeleteImage}
                  className="h-10 w-[145px] rounded-[50px] border-2 border-[#E10E0E] text-[12px] font-medium text-[#E10E0E] transition hover:bg-red-50"
                >
                  Delete Image
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <div className="flex flex-col gap-[60px]">
                {formFields.map(({ label, key, disabled }) => {
                  const isEditing = editingField === key

                  return (
                    <div key={key} className="flex items-center">
                      <label className="w-[204px] shrink-0 text-[18px] font-medium text-[#111928]">{label}</label>

                      <div className="relative flex w-full items-center transition-all duration-200 ease-in-out">
                        <input
                          type="text"
                          disabled={disabled}
                          value={isEditing ? tempValue : (profile[key] as string)}
                          onChange={e => setTempValue(e.target.value)}
                          onFocus={() => !disabled && startEdit(key)}
                          className={`h-[46px] flex-1 origin-left rounded-md border px-5 text-[16px] transition-all duration-200 ease-in-out outline-none ${isEditing ? 'border-[#1677FF] shadow-[0px_0px_4px_#1677FF]' : 'border-[#6B7280]'} ${disabled ? 'cursor-not-allowed bg-white' : 'bg-white'} text-[#9CA3AF]`}
                        />

                        {isEditing && !disabled && (
                          <div className="ml-5 flex origin-left items-center gap-5 transition-all duration-200 ease-in-out">
                            <button
                              onClick={saveEdit}
                              className="flex h-[46px] w-[51px] shrink-0 items-center justify-center rounded-lg border border-[#A6A6A6] bg-white transition hover:bg-green-50"
                            >
                              <img src={checkUrl} alt="Save" className="h-6 w-6" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex h-[46px] w-[51px] shrink-0 items-center justify-center rounded-lg border border-[#A6A6A6] bg-white transition hover:bg-red-50"
                            >
                              <img src={closeUrl} alt="Cancel" className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div className="flex w-[716px] justify-end pt-4">
                  <button
                    onClick={() => setIsChangePassModalOpen(true)}
                    className="h-10 w-[177px] rounded-lg bg-[#003087] text-[16px] font-medium text-white transition-colors hover:bg-[#00205a]"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal isOpen={isChangePassModalOpen} onClose={() => setIsChangePassModalOpen(false)} />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <img src={warningUrl} alt="warning" className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#111928]">Delete Profile Picture?</h3>
              <p className="mb-6 text-base text-[#637381]">
                Are you sure you want to delete your profile picture? This action cannot be undone.
              </p>

              <div className="flex w-full justify-center gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="min-w-[100px] rounded-[50px] border-2 border-[#F3F4F6] bg-white px-4 py-2.5 text-[16px] font-medium text-[#111928] transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteImage}
                  className="min-w-[100px] rounded-[50px] bg-[#E02424] px-4 py-2.5 text-[16px] font-medium text-white transition hover:bg-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
