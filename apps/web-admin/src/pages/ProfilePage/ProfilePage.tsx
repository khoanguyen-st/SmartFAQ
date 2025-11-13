import { useState, useRef } from 'react';
import CameraIcon from '@/assets/icons/camera.svg?react'
import DeleteIcon from '@/assets/icons/delete.svg?react'
import { Check, Close } from '@mui/icons-material'; 
import avatarIcon from "@/assets/icons/avatar.svg";
import ChangePassword from '@/pages/ProfilePage/ChangePassword.tsx';

type ProfileState = {
  username: string;
  email: string;
  phoneNumber: string;
  address: string;
  avatarUrl: string;
};

type ErrorState = {
  email: string;
  phoneNumber: string;
};

const ProfilePage = () => {
  const initialProfile: ProfileState = {
    username: '',
    email: '',
    phoneNumber: '',
    address: '',
    avatarUrl: avatarIcon
  };

  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [originalProfile, setOriginalProfile] = useState<ProfileState>(initialProfile);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  
  const [errors, setErrors] = useState<ErrorState>({
    email: '',
    phoneNumber: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangePasswordClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
      setAvatarError('Loại tệp không hợp lệ. Chỉ chấp nhận .jpg, .jpeg, .png.');
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAvatarError('Tệp quá lớn. Kích thước tối đa là 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const newAvatarUrl = reader.result as string;
      setProfile(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
      setOriginalProfile(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
    };
    
   
    reader.readAsDataURL(file); 
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAvatar = () => {
    setProfile(prev => ({ ...prev, avatarUrl: avatarIcon }));
    setOriginalProfile(prev => ({ ...prev, avatarUrl: avatarIcon }));
    setAvatarError('');
  };

  const validateField = (id: string, value: string): string => {
    if (id === 'email') {
     
      if (value.trim() !== '' && !value.includes('@')) {
        return 'Email không hợp lệ, phải chứa ký tự @.';
      }
    }
    if (id === 'phoneNumber') {
      const phoneRegex = /^[0-9]*$/; 
      if (!phoneRegex.test(value)) {
        return 'Số điện thoại chỉ được chứa các chữ số.';
      }
    }
    return ''; 
  };

  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    setProfile(prevProfile => ({
      ...prevProfile,
      [id]: value
    }));

    if (id === 'email' || id === 'phoneNumber') {
       setErrors(prev => ({
        ...prev,
        [id]: '' 
      }));
    }
  };

  const handleSaveField = (fieldName: keyof ProfileState) => {
    const value = profile[fieldName];
    
    const error = validateField(fieldName, value as string);
    if (error) {
      if (fieldName === 'email' || fieldName === 'phoneNumber') {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
      }
      return; 
    }

    setOriginalProfile(prev => ({
      ...prev,
      [fieldName]: profile[fieldName]
    }));
    if (fieldName === 'email' || fieldName === 'phoneNumber') {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleCancelField = (fieldName: keyof ProfileState) => {
    setProfile(prev => ({
      ...prev,
      [fieldName]: originalProfile[fieldName]
    }));
    
    if (fieldName === 'email' || fieldName === 'phoneNumber') {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };


  return (
    <div className="bg-gray-50 min-h-screen">
      
      <div className="max-w-7xl mx-auto p-8">

        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-base text-gray-600 mt-1">
              Summary of personal information
            </p>
          </div>
          <button
            onClick={handleChangePasswordClick}
            className="px-4 py-2 bg-[#003087] text-white rounded-lg font-medium hover:bg-[#002a73] focus:outline-none focus:ring-2 focus:ring-[#003087] focus:ring-opacity-50"
          >
            Change Password
          </button>
        </header>

        {/* THAY ĐỔI 1: Tăng padding từ p-8 lên p-12 */}
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
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdateAvatar}
                  className="p-2 text-gray-700 hover:text-blue-600"
                  aria-label="Change profile picture"
                >
                  <CameraIcon />
                </button>
                <button
                  onClick={handleDeleteAvatar}
                  className="p-2 text-gray-700 hover:text-red-600"
                  aria-label="Delete profile picture"
                >
                  <DeleteIcon />
                </button>
              </div>
              {avatarError && (
                <p className="text-sm text-red-600 mt-2 text-center">{avatarError}</p>
              )}
            </div>

            {/* THAY ĐỔI 2: Tăng khoảng cách từ gap-6 lên gap-8 */}
            <form className="md:col-span-8 flex flex-col gap-8 justify-center">
            
              {/* Username Field */}
              <div className="flex items-center gap-4">
                <label 
                  htmlFor="username" 
                  className="block text-sm font-medium text-gray-700 w-[120px] flex-shrink-0"
                >
                  Username 
                </label>
                <div className="flex items-center gap-4 w-full">
                  <div className="grow">
                    <input
                      type="text"
                      id="username"
                      placeholder="Username123"
                      value={profile.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveField('username')}
                      className={`p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                        profile.username !== originalProfile.username ? 'visible' : 'invisible'
                      }`}
                      aria-label="Save username"
                      disabled={profile.username === originalProfile.username}
                    >
                      <Check fontSize="small" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelField('username')}
                      className={`p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                        profile.username !== originalProfile.username ? 'visible' : 'invisible'
                      }`}
                      aria-label="Cancel username change"
                      disabled={profile.username === originalProfile.username}
                    >
                      <Close fontSize="small" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="flex items-center gap-4">
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 w-[120px] flex-shrink-0"
                >
                  Email 
                </label>
                <div className="flex items-center gap-4 w-full">
                  <div className="grow">
                    <input
                      type="email"
                      id="email"
                      placeholder="nguyenvana123@example.com"
                      value={profile.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveField('email')}
                      className={`p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                        profile.email !== originalProfile.email ? 'visible' : 'invisible'
                      }`}
                      aria-label="Save email"
                      disabled={profile.email === originalProfile.email}
                    >
                      <Check fontSize="small" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelField('email')}
                      className={`p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                        profile.email !== originalProfile.email ? 'visible' : 'invisible'
                      }`}
                      aria-label="Cancel email change"
                      disabled={profile.email === originalProfile.email}
                    >
                      <Close fontSize="small" />
                    </button>
                  </div>
                </div>
                {errors.email && (
                  <p className="text-sm mt-1 col-start-2" style={{ color: '#d32f2f' }}> 
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number Field */}
              <div className="flex items-center gap-4">
                <label 
                  htmlFor="phoneNumber" 
                  className="block text-sm font-medium text-gray-700 w-[120px] flex-shrink-0"
                >
                  Phone Number
                </label>
                <div className="flex items-center gap-4 w-full">
                  <div className="grow">
                    <input
                      type="tel"
                      id="phoneNumber"
                      placeholder="0312345678"
                      value={profile.phoneNumber}
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveField('phoneNumber')}
                      className={`p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                        profile.phoneNumber !== originalProfile.phoneNumber ? 'visible' : 'invisible'
                      }`}
                      aria-label="Save phone number"
                      disabled={profile.phoneNumber === originalProfile.phoneNumber}
                    >
                      <Check fontSize="small" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelField('phoneNumber')}
                      className={`p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                        profile.phoneNumber !== originalProfile.phoneNumber ? 'visible' : 'invisible'
                      }`}
                      aria-label="Cancel phone number change"
                      disabled={profile.phoneNumber === originalProfile.phoneNumber}
                    >
                      <Close fontSize="small" />
                    </button>
                  </div>
                </div>
                {errors.phoneNumber && (
                  <p className="text-sm mt-1 col-start-2" style={{ color: '#d32f2f' }}> 
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Address Field */}
              <div className="flex items-center gap-4">
                <label 
                  htmlFor="address" 
                  className="block text-sm font-medium text-gray-700 w-[120px] flex-shrink-0"
                >
                  Address
                </label>
                <div className="flex items-center gap-4 w-full">
                  <div className="grow">
                    <input
                      type="text"
                      id="address"
                      placeholder="K03/4, Hai Ba Trung, Ha Noi, Viet Nam"
                      value={profile.address}
                      onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveField('address')}
                      className={`p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                        profile.address !== originalProfile.address ? 'visible' : 'invisible'
                      }`}
                      aria-label="Save address"
                      disabled={profile.address === originalProfile.address}
                    >
                      <Check fontSize="small" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelField('address')}
                      className={`p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                        profile.address !== originalProfile.address ? 'visible' : 'invisible'
                      }`}
                      aria-label="Cancel address change"
                      disabled={profile.address === originalProfile.address}
                    >
                      <Close fontSize="small" />
                    </button>
                  </div>
                </div>
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