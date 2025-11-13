import { Navigate, Route, Routes } from 'react-router-dom'
import { UploadedPage, DashboardPage, LogsPage, SettingsPage, ViewChatPage } from './pages'
import ShellLayout from './components/ShellLayout'

const App = () => (
  <ShellLayout>
    <Routes>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="logs" element={<LogsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="uploaded" element={<UploadedPage />} />
      <Route path="view-chat" element={<ViewChatPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  </ShellLayout>
)

export default App
