import { useState } from 'react'
import Sidebar    from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'

export default function Home() {
  const [activeChat, setActiveChat] = useState(null)
  const [showChat,   setShowChat]   = useState(false) // للموبايل

  function handleSelectChat(chat) {
    setActiveChat(chat)
    setShowChat(true)
  }

  function handleCloseChat() {
    setShowChat(false)
    setActiveChat(null)
  }

  return (
    <div className="flex h-screen bg-chat-bg overflow-hidden">
      {/* ─── Sidebar (hidden on mobile when chat is open) ─────────────────── */}
      <div
        className={`
          ${showChat ? 'hidden md:flex' : 'flex'}
          w-full md:w-80 lg:w-96
          flex-col h-full
          border-l border-chat-border
        `}
      >
        <Sidebar
          onSelectChat={handleSelectChat}
          activeChatId={activeChat?.id}
          onCloseChat={handleCloseChat}
        />
      </div>

      {/* ─── Chat Window ──────────────────────────────────────────────────── */}
      <div
        className={`
          ${!showChat ? 'hidden md:flex' : 'flex'}
          flex-1 flex-col h-full overflow-hidden
        `}
      >
        <ChatWindow
          chat={activeChat}
          onClose={handleCloseChat}
        />
      </div>
    </div>
  )
}
