import { Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/Dashboard";
import LogsPage from "./pages/Logs";
import SettingsPage from "./pages/Settings";
import ShellLayout from "./components/ShellLayout";
import ProfilePage from "./pages/ProfilePage/ProfilePage"; 

const App = () => (
  <ShellLayout>
    <Routes>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="logs" element={<LogsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="profile" element={<ProfilePage />} /> 
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  </ShellLayout>
);

export default App;