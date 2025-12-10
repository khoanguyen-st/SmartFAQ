import { Navigate, Route, Routes } from 'react-router-dom'

import DashboardPage from './pages/Dashboard'
import LogsPage from './pages/Logs'
import SettingsPage from './pages/Settings'
import UsersPage from './pages/Users'
import LoginPage from './pages/Login'
import ForgotPasswordPage from './pages/Forgotpassword'
import CreateNewPasswordPage from './pages/Create'
import ResetPasswordSuccessPage from './pages/Resetpasssuccess'
import ViewChatPage from './pages/ViewChat'
import DepartmentPage from './pages/Departments'
import ProfilePage from './pages/Profile'
import UploadedPage from './pages/UploadedDocuments'
import ShellLayout from './components/ShellLayout'
// Import RoleGuard
import RoleGuard from './components/RoleGuard'

const App = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="forgotpassword" element={<ForgotPasswordPage />} />
    <Route path="create-new-password" element={<CreateNewPasswordPage />} />
    <Route path="reset-password-success" element={<ResetPasswordSuccessPage />} />

    {/* Protected Routes */}
    <Route element={<ShellLayout />} path="/*">
      {/* 1. Các trang chung (Admin & Staff đều xem được) */}
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="logs" element={<LogsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="uploaded" element={<UploadedPage />} />
      <Route path="profile" element={<ProfilePage />} />

      {/* 2. Các trang chỉ dành cho Admin (Users, Departments) */}
      <Route
        path="users"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <UsersPage />
          </RoleGuard>
        }
      />
      <Route
        path="departments"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <DepartmentPage />
          </RoleGuard>
        }
      />

      {/* 3. Trang chỉ dành cho Staff (View Chat) */}
      <Route
        path="view-chat"
        element={
          <RoleGuard allowedRoles={['staff']}>
            <ViewChatPage />
          </RoleGuard>
        }
      />

      {/* Fallback - Chuyển về Dashboard nếu không tìm thấy trang */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Route>
  </Routes>
)

export default App
