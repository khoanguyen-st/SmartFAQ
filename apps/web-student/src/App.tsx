import { Navigate, Route, Routes } from 'react-router-dom'

import ChatWidget from './components/Chatbot/ChatWidget'
import { I18nProvider } from './lib/i18n'

const App = () => {
  return (
    <I18nProvider>
      <Routes>
        <Route path="chatWidget" element={<ChatWidget />} />
        <Route path="*" element={<Navigate to="chatWidget" replace />} />
      </Routes>
    </I18nProvider>
  )
}

export default App
