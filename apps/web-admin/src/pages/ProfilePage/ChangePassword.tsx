import React, { useState } from 'react';
import {Modal,Box,Typography,TextField,Stack,IconButton,InputAdornment}
from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

interface ChangePasswordProps {
  open: boolean;
  onClose: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ open, onClose }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleCloseAndReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    let hasClientError = false;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (newPassword && !passwordRegex.test(newPassword)) {
      setNewPasswordError("Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt.");
      hasClientError = true;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp!");
      hasClientError = true;
    }

    if (hasClientError) {
      return;
    }

    console.log('Simulating API call with:', {
      currentPassword,
      newPassword,
    });

    if (currentPassword === 'wrongpassword') {
      setCurrentPasswordError("Mật khẩu hiện tại không đúng.");
      return;
    }

    if (newPassword === 'WeakPass') {
      setNewPasswordError("Mật khẩu không đáp ứng yêu cầu bảo mật.");
      return;
    }
    
    console.log("Password changed successfully (simulated).");
    handleCloseAndReset();
  };

  return (
    <Modal
      open={open}
      onClose={handleCloseAndReset}
      aria-labelledby="change-password-modal-title"
      aria-describedby="change-password-modal-description"
    >
      <Box sx={style}>
        <Typography id="change-password-modal-title" variant="h5" component="h2" fontWeight="bold">
          Change Password
        </Typography>
        <Typography id="change-password-modal-description" sx={{ mt: 1, mb: 3, color: 'text.secondary' }}>
          Secure your account with a new password.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              required
              fullWidth
              name="currentPassword"
              label="Current password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={!!currentPasswordError}
              helperText={currentPasswordError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle current password visibility"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiFormLabel-asterisk': { color: 'red' }
              }}
            />

            <TextField
              required
              fullWidth
              name="newPassword"
              label="New password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={!!newPasswordError}
              helperText={newPasswordError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle new password visibility"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiFormLabel-asterisk': { color: 'red' }
              }}
            />

            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
              
              InputProps ={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiFormLabel-asterisk': { color: 'red' }
              }}
            />

            {/* THAY ĐỔI: Cập nhật lớp Tailwind cho nút bấm */}
            <div className="flex justify-end gap-4 mt-4">
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#003087] text-white rounded-lg font-medium hover:bg-[#002a73] focus:outline-none focus:ring-2 focus:ring-[#003087] focus:ring-opacity-50"
              >
                Update
              </button>
            </div>
            {/* KẾT THÚC THAY ĐỔI */}

          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};

export default ChangePassword;