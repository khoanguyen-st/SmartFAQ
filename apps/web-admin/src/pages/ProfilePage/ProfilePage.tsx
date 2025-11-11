import React, { useState, useRef } from 'react';
import ChangePasswordModal from './ChangePasswordModal'; 

import CameraIcon from '../assets/icons/Image.svg?react'; 
import TrashIcon from '../assets/icons/icon.svg?react'; 

interface ProfileState {
  username: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  image: string | null;
}

const MOCK_USER_PROFILE: ProfileState = {
  username: "nguyenan123",
  email: "nguyenan123@example.com",
  phoneNumber: "02546987213",
  address: "K03/4, Hai Ba Trung, Ha Noi, Viet Nam",
  image: "https://i.imgur.com/v817t0S.png", 
};

const ProfilePage = () => {
  const [profile, setProfile] = useState<ProfileState>(MOCK_USER_PROFILE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prevProfile => {
      const newProfile = { ...prevProfile, [name]: value };
      if (name === 'email') {
        const usernamePart = value.split('@')[0];
        newProfile.username = usernamePart || ""; 
      }
      return newProfile;
    });
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newImageUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, image: newImageUrl }));
      alert(`Đã chọn ảnh: ${file.name}`);
    }
  };

  const handleDeleteAvatar = () => {
    setProfile(prev => ({ ...prev, image: null })); 
    alert("Đã xóa ảnh đại diện (Mock)");
  };

  const openChangePasswordModal = () => setIsModalOpen(true);
  const closeChangePasswordModal = () => setIsModalOpen(false);

  return (
    <div className="p-6 bg-gray-50 min-h-screen"> 
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">Summary of personal information</p>
        </div>
        <button
          onClick={openChangePasswordModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Change Password
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:space-x-8">
          
          <div className="flex flex-col items-center md:w-1/3 mb-6 md:mb-0">
            <div className="relative">
              <img
                src={profile.image || 'https://via.placeholder.com/150?text=No+Image'}
                alt="Avatar"
                className="w-40 h-40 rounded-full object-cover border-4 border-gray-100"
              />
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                onClick={handleCameraClick}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Change Image"
              >
                <CameraIcon className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={handleDeleteAvatar}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Delete Image"
              >
                <TrashIcon className="w-6 h-6 text-red-500" />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg, .jpeg, .png"
              className="hidden"
            />
          </div>

          <div className="md:w-2/3">
            <div className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={profile.username}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 focus:outline-none cursor-not-allowed"
                  disabled 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={profile.phoneNumber || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={profile.address || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ChangePasswordModal onClose={closeChangePasswordModal} />
      )}
    </div>
  );
};

export default ProfilePage;