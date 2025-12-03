import { Navigate, Route, Routes } from 'react-router-dom'

import DashboardPage from './pages/Dashboard'
import LogsPage from './pages/Logs'
import SettingsPage from './pages/Settings'
import LoginPage from './pages/Login'
import ForgotPasswordPage from './pages/Forgotpassword'
import CreateNewPasswordPage from './pages/Create'
import ResetPasswordSuccessPage from './pages/Resetpasssuccess'
import ViewChatPage from './pages/ViewChat'
import ProfilePage from './pages/Profile'
import ShellLayout from './components/ShellLayout'

const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="forgotpassword" element={<ForgotPasswordPage />} />
    <Route path="create-new-password" element={<CreateNewPasswordPage />} />
    <Route path="reset-password-success" element={<ResetPasswordSuccessPage />} />
    <Route element={<ShellLayout />} path="/*">
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="logs" element={<LogsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="uploaded" element={<UploadedPage />} />
      <Route path="view-chat" element={<ViewChatPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Route>
  </Routes>
)

export default App
