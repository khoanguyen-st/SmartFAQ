import checkUrl from '@/assets/icons/checkmark.svg'
import closeUrl from '@/assets/icons/close.svg'
import avatarDefaultUrl from '@/assets/icons/user-avatar.svg'
import warningUrl from '@/assets/icons/warning.svg'
import ChangePasswordModal from '@/components/profile/ChangePasswordModal'
import { UserProfile, deleteAvatar, getUserProfile, updateUserProfile, uploadAvatar } from '@/services/user.services'
import { getCurrentUserInfo } from '@/services/auth.services'
import { useEffect, useRef, useState } from 'react'

const ProfilePage = () => {
  const [userId, setUserId] = useState<number | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // State quản lý việc edit
  const [editingField, setEditingField] = useState<keyof UserProfile | null>(null)
  const [tempValue, setTempValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cấu hình các trường form, mapping key khớp với Interface UserProfile
  const formFields: { label: string; key: keyof UserProfile; disabled?: boolean }[] = [
    { label: 'Email', key: 'email', disabled: true },
    { label: 'Username', key: 'username' },
    { label: 'Phone Number', key: 'phoneNumber' }, // Dùng key 'phoneNumber' để Service tự map sang 'phone_number'
    { label: 'Address', key: 'address' }
  ]

  // --- Fetch Profile ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)

        // Get current user info to retrieve userId
        const userInfo = await getCurrentUserInfo()
        setUserId(userInfo.id)

        // Fetch full profile with userId
        const data = await getUserProfile(userInfo.id)
        setProfile(data)
      } catch (err) {
        console.error(err)
        setError('Failed to load profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // --- Handle Avatar Upload ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && profile && userId) {
      // 1. Optimistic Update: Hiển thị ảnh ngay lập tức để UX mượt
      const objectUrl = URL.createObjectURL(file)
      setProfile(prev => (prev ? { ...prev, avatar_url: objectUrl } : null))

      try {
        // 2. Gọi API upload
        const res = await uploadAvatar(userId, file)

        // 3. Cập nhật lại URL chính thức từ server trả về (nếu có)
        if (res.image) {
          setProfile(prev => (prev ? { ...prev, avatar_url: res.image } : null))
        }
      } catch (err) {
        console.error('Upload failed:', err)
        alert('Failed to upload avatar.')
        // Rollback nếu lỗi: load lại profile gốc
        const data = await getUserProfile(userId)
        setProfile(data)
      }
    }
  }

  // --- Handle Avatar Delete ---
  const handleDeleteImage = () => {
    if (profile?.avatar_url) setIsDeleteModalOpen(true)
  }

  const confirmDeleteImage = async () => {
    if (!userId) return

    try {
      await deleteAvatar(userId)
      setProfile(prev => (prev ? { ...prev, avatar_url: null } : null))
      setIsDeleteModalOpen(false)
    } catch (err) {
      console.error('Delete avatar failed:', err)
      alert('Failed to delete avatar.')
    }
  }

  // --- Handle Inline Edit ---
  const startEdit = (field: keyof UserProfile) => {
    if (!profile) return
    setEditingField(field)
    setTempValue(String(profile[field] || ''))
  }

  const cancelEdit = () => {
    setEditingField(null)
    setTempValue('')
  }

  const saveEdit = async () => {
    if (editingField && profile && userId) {
      try {
        // Gửi API update
        await updateUserProfile(userId, { [editingField]: tempValue })

        // Cập nhật state local nếu thành công
        setProfile(prev => (prev ? { ...prev, [editingField]: tempValue } : null))
        setEditingField(null)
      } catch (err) {
        console.error('Update failed:', err)
        alert('Failed to update profile.')
      }
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading profile...</div>
  if (error || !profile) return <div className="p-10 text-center text-red-500">{error || 'Profile not found'}</div>

  return (
    <div className="flex h-[calc(100vh-81px)] w-full flex-col overflow-y-auto bg-[#F9FAFB]">
      <div className="mx-auto flex min-h-full w-full max-w-[1535px] flex-col px-8 xl:px-[100px]">
        {/* Header */}
        <div className="flex shrink-0 items-end justify-between py-10">
          <div>
            <h2 className="text-[32px] font-bold text-[#111827] lg:text-[40px] lg:leading-12">My Profile</h2>
            <p className="mt-1 text-[16px] font-medium text-[#637381] lg:text-[18px] lg:leading-[26px]">
              Summary of personal information
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="mb-[130px] flex w-full shrink-0 flex-col items-center gap-10 rounded-[20px] border border-[#E5E7EB] bg-white p-8 shadow-sm lg:flex-row lg:items-start lg:gap-[120px] lg:p-[100px]">
          {/* Avatar Section */}
          <div className="flex shrink-0 flex-col items-center">
            <div className="h-[200px] w-[200px] overflow-hidden rounded-full shadow-[0px_4px_10px_rgba(0,0,0,0.15)] xl:h-[303px] xl:w-[303px]">
              <img src={profile.avatar_url || avatarDefaultUrl} alt="Profile" className="h-full w-full object-cover" />
            </div>

            <div className="mt-8 flex w-full max-w-[303px] justify-between gap-4 lg:mt-11">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-10 flex-1 rounded-[50px] border border-[#003087] text-[12px] font-bold text-[#003087] transition hover:bg-blue-50"
              >
                Edit Image
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

              <button
                onClick={handleDeleteImage}
                disabled={!profile.avatar_url}
                className={`h-10 flex-1 rounded-[50px] border border-[#E10E0E] text-[12px] font-bold text-[#E10E0E] transition ${!profile.avatar_url ? 'cursor-not-allowed opacity-50' : 'hover:bg-red-50'}`}
              >
                Delete Image
              </button>
            </div>
          </div>

          {/* Form Section */}
          <div className="flex w-full flex-1 flex-col justify-center">
            <div className="flex flex-col gap-6 lg:gap-[60px]">
              {formFields.map(({ label, key, disabled }) => {
                const isEditing = editingField === key

                return (
                  <div key={key} className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-0">
                    <label className="shrink-0 text-[16px] font-semibold text-[#111928] lg:w-[250px] lg:text-[18px]">
                      {label}
                    </label>

                    <div className="relative flex w-full items-center">
                      <input
                        type="text"
                        disabled={disabled}
                        value={isEditing ? tempValue : String(profile[key] || '')}
                        onChange={e => setTempValue(e.target.value)}
                        onFocus={() => !disabled && startEdit(key)}
                        className={`h-[46px] w-full rounded-md border px-5 text-[16px] transition-all duration-200 outline-none ${isEditing ? 'border-[#1677FF] shadow-[0px_0px_4px_#1677FF]' : 'border-[#6B7280]'} ${disabled ? 'cursor-not-allowed bg-white text-[#9CA3AF]' : 'bg-white text-[#111928]'}`}
                      />

                      {isEditing && !disabled && (
                        <div className="absolute top-full right-0 z-10 mt-1 flex items-center gap-2 rounded-md bg-white p-2 shadow-lg lg:relative lg:top-auto lg:mt-0 lg:ml-4 lg:bg-transparent lg:p-0 lg:shadow-none">
                          <button
                            onClick={saveEdit}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#A6A6A6] bg-white hover:bg-green-50"
                          >
                            <img src={checkUrl} alt="Save" className="h-5 w-5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#A6A6A6] bg-white hover:bg-red-50"
                          >
                            <img src={closeUrl} alt="Cancel" className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              <div className="flex w-full justify-end pt-4">
                <button
                  onClick={() => setIsChangePassModalOpen(true)}
                  className="h-10 w-full rounded-lg bg-[#003087] text-[16px] font-medium text-white transition hover:bg-[#00205a] sm:w-[177px]"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePassModalOpen}
        onClose={() => setIsChangePassModalOpen(false)}
        userId={userId || 1}
      />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
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
                  className="min-w-[100px] rounded-[50px] border-2 border-[#F3F4F6] bg-white px-4 py-2.5 text-[16px] font-medium text-[#111928] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteImage}
                  className="min-w-[100px] rounded-[50px] bg-[#E02424] px-4 py-2.5 text-[16px] font-medium text-white hover:bg-red-800"
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
