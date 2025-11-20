import React from 'react'
import ChatWidget from '@/components/Chatbot/ChatWidget'

const DefaultPage = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <h1>Default Page</h1>
      <ChatWidget />
    </div>
  )
}

export default DefaultPage
