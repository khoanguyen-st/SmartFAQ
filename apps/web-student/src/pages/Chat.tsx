import React from 'react'
import ChatWidget from '@/components/Chatbot/ChatWidget'

const ChatPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-indigo-50 px-6 pb-8">
      <ChatWidget />
    </div>
  )
}

export default ChatPage
