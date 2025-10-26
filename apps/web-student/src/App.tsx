import { Navigate, Route, Routes } from "react-router-dom";

import ChatPage from "./pages/Chat";
import { I18nProvider } from "./lib/i18n";

const App = () => {
  return (
    <I18nProvider>
      <Routes>
        <Route path="chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="chat" replace />} />
      </Routes>
    </I18nProvider>
  );
};

export default App;
