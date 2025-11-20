import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Check, X } from 'lucide-react';
import avatarIcon from '@/assets/icons/avatar.svg';
import ChangePassword from '@/pages/ProfilePage/ChangePassword.tsx';
import React from 'react';

type ProfileState = {
  username: string;
  email: string;
  phoneNumber: string;
  address: string;
  avatarUrl: string;
};

const ProfilePage = () => {
  const { t } = useTranslation();

  const initialProfile: ProfileState = {
    username: '',
    email: 'nguyenan123@example.com',
    phoneNumber: '',
    address: '',
    avatarUrl: avatarIcon,
  };

  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [tempProfile, setTempProfile] = useState<ProfileState>(initialProfile);
  const [editingField, setEditingField] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangePasswordClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setTempProfile((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveClick = () => {
    setProfile(tempProfile);
    setEditingField(null);
  };

  const handleCancelClick = () => {
    setTempProfile(profile);
    setEditingField(null);
  };

  const handleEditClick = (fieldName: string) => {
    if (editingField && editingField !== fieldName) {
      handleCancelClick();
    }
    setEditingField(fieldName);
  };

  const handleUpdateAvatar = () => {
    setAvatarError('');
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError(t('Chỉ sử dụng định dạng .jpg, .jpeg và .png'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAvatarError(t('Ảnh vượt quá kích thước cho phép 5MB'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const newAvatarUrl = reader.result as string;
      setProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
      setTempProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
    };

    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAvatar = () => {
    setProfile((prev) => ({ ...prev, avatarUrl: avatarIcon }));
    setTempProfile((prev) => ({ ...prev, avatarUrl: avatarIcon }));
    setAvatarError('');
  };

  const renderProfileField = (
    fieldId: keyof ProfileState,
    label: string,
    type: string = 'text',
    isEditable: boolean = true
  ) => {
    const isEditing = editingField === fieldId;

    return (
      <div className="flex items-center gap-4">
        <label
          htmlFor={fieldId}

          className="block text-sm font-medium text-gray-700 w-32 "
        >
          {t(label)}
        </label>

        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <input
            type={type}
            id={fieldId}
            value={tempProfile[fieldId]}
            readOnly={!isEditing}
            disabled={!isEditable && !isEditing}
            onChange={handleInputChange}
            onClick={() => isEditable && handleEditClick(fieldId)}
            className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
              flex-1 transition-colors duration-200 ease-in-out 
              ${
                isEditing
                  ? 'bg-white'
                  : isEditable
                  ? 'bg-gray-100 cursor-pointer'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          />

          <div
            className={`flex items-center gap-2 transition-all duration-200 ${
              isEditing
                ? 'max-w-md opacity-100'
                : 'max-w-0 opacity-0 overflow-hidden'
            }`}
          >
            <button
              type="button"
              onClick={handleSaveClick}
              className="p-2 border border-gray-300 rounded-md text-green-600 hover:bg-green-50"
            >
              <Check size={20} />
            </button>
            <button
              type="button"
              onClick={handleCancelClick}
              className="p-2 border border-gray-300 rounded-md text-red-600 hover:bg-red-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('My Profile')}
            </h1>
            <p className="text-base text-gray-600 mt-1">
              {t('Summary of personal information')}
            </p>
          </div>

          <button className="px-4 py-2 bg-[#003087] text-white rounded-lg font-medium hover:bg-[#002a73] focus:outline-none focus:ring-2 focus:ring-[#003087] focus:ring-opacity-50 flex items-center gap-2">
            <Eye size={18} />
            {t('See Your Documents')}
          </button>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-200 flex justify-between items-center">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 w-full">
            <div className="md:col-span-4 flex flex-col items-center justify-center">
              <img
                src={profile.avatarUrl}
                alt="Profile Avatar"
                className="w-75 h-75 rounded-full object-cover mb-4"
              />
              <input
                type="file"
                id="myFile"
                name="filename"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png"
                style={{ display: 'none' }}
              />
              <div className="flex gap-5">
                <button
                  onClick={handleUpdateAvatar}
                  className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-2xl font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {t('Edit Image')}
                </button>
                <button
                  onClick={handleDeleteAvatar}
                  className="px-4 py-2 bg-white border border-red-600 text-red-600 rounded-2xl font-medium hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  {t('Delete Image')}
                </button>
              </div>
              {avatarError && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  {avatarError}
                </p>
              )}
            </div>

            <form className="md:col-span-8 flex flex-col gap-6 justify-center">
              {renderProfileField('email', 'Email', 'email', false)}
              {renderProfileField('username', 'Username', 'text')}
              {renderProfileField('phoneNumber', 'Phone Number', 'tel')}
              {renderProfileField('address', 'Address', 'text')}

              <div className="flex justify-end mt-4 pr-3"> 
              <button
              type="button"
              onClick={handleChangePasswordClick}
              className="px-4 py-2 bg-[#003087] text-white rounded-lg font-medium hover:bg-[#002a73] focus:outline-none focus:ring-2 focus:ring-[#003087] focus:ring-opacity-50"
              disabled={!!editingField} >
              {t('Change Password')}
              </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ChangePassword open={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default ProfilePage;