import { Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/Dashboard";
import LogsPage from "./pages/Logs";
import SettingsPage from "./pages/Settings";
import LoginPage from "./pages/Login";
import ShellLayout from "./components/ShellLayout";

const App = () => (
  <Routes>
    <Route path="login" element={<LoginPage />} />
    <Route
      element={<ShellLayout />}
      path="/*"
    >
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="logs" element={<LogsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Route>
  </Routes>
);

export default App;
