import { Navigate, Route, Routes } from 'react-router-dom'

import ChatWidget from './components/Chatbot/ChatWidget'
import FullPageChat from './pages/FullPageChat'
import { I18nProvider } from './lib/i18n'

const App = () => {
  return (
    <I18nProvider>
      <Routes>
        <Route path="widget" element={<ChatWidget />} />
        <Route path="chat" element={<FullPageChat />} />
        <Route path="*" element={<Navigate to="widget" replace />} />
      </Routes>
    </I18nProvider>
  )
}

export default App
