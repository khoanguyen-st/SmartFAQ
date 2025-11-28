import { Navigate, Route, Routes } from 'react-router-dom'

import DashboardPage from './pages/Dashboard'
import LogsPage from './pages/Logs'
import SettingsPage from './pages/Settings'
import UsersPage from './pages/Users'
import LoginPage from './pages/Login'
import ForgotPasswordPage from './pages/Forgotpassword'
import CreateNewPasswordPage from './pages/Create'
import ResetPasswordSuccessPage from './pages/Resetpasssuccess'
import ShellLayout from './components/ShellLayout'
import ViewChatPage from './pages/ViewChat'

const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="forgotpassword" element={<ForgotPasswordPage />} />
    <Route path="create-new-password" element={<CreateNewPasswordPage />} />
    <Route path="reset-password-success" element={<ResetPasswordSuccessPage />} />
    <Route element={<ShellLayout />} path="/*">
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="logs" element={<LogsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="view-chat" element={<ViewChatPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Route>
  </Routes>
)

export default App
