import { Navigate, Route, Routes } from 'react-router-dom'
import { ReactNode } from 'react'

import UploadedPage from './pages/UploadedDocuments'
import DashboardPage from './pages/Dashboard'
import LogsPage from './pages/Logs'
import UsersPage from './pages/Users'
import SettingsPage from './pages/Settings'
import LoginPage from './pages/Login'
import ViewChatPage from './pages/ViewChat'
import ShellLayout from './components/ShellLayout'
import { getAuthToken } from './lib/auth'

// Simple auth check component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = getAuthToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/*"
      element={
        <ProtectedRoute>
          <ShellLayout>
            <Routes>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="logs" element={<LogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="uploaded" element={<UploadedPage />} />
              <Route path="view-chat" element={<ViewChatPage />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ShellLayout>
        </ProtectedRoute>
      }
    />
  </Routes>
)

export default App
