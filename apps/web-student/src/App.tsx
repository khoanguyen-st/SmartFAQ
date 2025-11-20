import { Navigate, Route, Routes } from 'react-router-dom'

import ChatPage from './pages/Chat'
import DefaultPage from './pages/Default'
import { I18nProvider } from './lib/i18n'

const App = () => {
  return (
    <I18nProvider>
      <Routes>
        <Route path="chat" element={<ChatPage />} />
        <Route path="default" element={<DefaultPage />} />
        <Route path="*" element={<Navigate to="default" replace />} />
      </Routes>
    </I18nProvider>
  )
}

export default App
