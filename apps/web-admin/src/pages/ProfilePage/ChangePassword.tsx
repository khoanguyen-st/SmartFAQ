import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
  const { t } = useTranslation();

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

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);

    if (value && !passwordRegex.test(value)) {
      setNewPasswordError(
        'Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, và 1 ký tự đặc biệt.',
      );
    } else {
      setNewPasswordError('');
    }

    if (confirmPassword && value !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không trùng khớp.');
    } else if (confirmPassword) {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (value && newPassword && value !== newPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không trùng khớp.');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    let hasClientError = false;


    if (newPassword && !passwordRegex.test(newPassword)) {
      setNewPasswordError(
        'Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, và 1 ký tự đặc biệt.',
      );
      hasClientError = true;
    }


    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không trùng khớp.');
      hasClientError = true;
    }

    if (hasClientError) {
      return;
    }

    if (currentPassword === 'wrongpassword') {
      setCurrentPasswordError(t('changePassword.error.wrongCurrent'));
      return;
    }

    if (newPassword === 'WeakPass') {
      setNewPasswordError(t('changePassword.error.weak'));
      return;
    }

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
        <Typography
          id="change-password-modal-title"
          variant="h5"
          component="h2"
          fontWeight="bold"
        >
          {t('Change Password')}
        </Typography>
        <Typography
          id="change-password-modal-description"
          sx={{ mt: 1, mb: 3, color: 'text.secondary' }}
        >
          {t('Secure your account with a new password.')}
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              required
              fullWidth
              name="currentPassword"
              label={t('Current Password')}
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={!!currentPasswordError}
              helperText={currentPasswordError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t('changePassword.form.aria.toggleCurrent')}
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      edge="end"
                    >
                      {showCurrentPassword ? <Eye /> : <EyeOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiFormLabel-asterisk': { color: 'red' },
              }}
            />

            <TextField
              required
              fullWidth
              name="newPassword"
              label={t('New Password')}
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}

              onChange={handleNewPasswordChange}
              error={!!newPasswordError}
              helperText={newPasswordError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t('changePassword.form.aria.toggleNew')}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <Eye /> : <EyeOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiFormLabel-asterisk': { color: 'red' },
              }}
            />

            <TextField
              required
              fullWidth
              name="confirmPassword"
              label={t('Confirm Password')}
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
            
              onChange={handleConfirmPasswordChange}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t('changePassword.form.aria.toggleConfirm')}
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <Eye /> : <EyeOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiFormLabel-asterisk': { color: 'red' },
              }}
            />

            <Stack
              direction="row"
              spacing={2}
              justifyContent="flex-end"
              sx={{ mt: 3 }}
            >
              <button
                onClick={handleCloseAndReset}
                className="ring-2 ring-gray-300 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:ring-opacity-50 text-sm"
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                className="bg-[#003087] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#002a73] focus:outline-none focus:ring-2 focus:ring-[#003087] focus:ring-opacity-50 text-sm"
              >
                {t('Update')}
              </button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};

export default ChangePassword;