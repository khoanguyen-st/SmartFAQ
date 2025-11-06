import { Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/Dashboard";
import LogsPage from "./pages/Logs";
import SettingsPage from "./pages/Settings";
import ViewChatPage from "./pages/ViewChat";
import ShellLayout from "./components/ShellLayout";


const App = () => (
  <ShellLayout>
    <Routes>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="logs" element={<LogsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="view-chat" element={<ViewChatPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  </ShellLayout>
);

export default App;
