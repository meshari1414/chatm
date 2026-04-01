import { useState, useEffect } from 'react'
import {
  collection, query, where, onSnapshot, doc, getDoc,
  updateDoc, deleteDoc, arrayRemove,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  MessageCircle, UserPlus, Users, LogOut, Search, MoreVertical, Trash2,
} from 'lucide-react'
import Avatar from './Avatar'
import AddFriendModal   from './AddFriendModal'
import CreateGroupModal from './CreateGroupModal'
import ProfileModal     from './ProfileModal'

export default function Sidebar({ onSelectChat, activeChatId, onCloseChat }) {
  const { currentUser, userProfile, logout } = useAuth()
  const [chats,        setChats]        = useState([])
  const [search,       setSearch]       = useState('')
  const [showAdd,      setShowAdd]      = useState(false)
  const [showGroup,    setShowGroup]    = useState(false)
  const [showMenu,     setShowMenu]     = useState(false)
  const [showProfile,  setShowProfile]  = useState(false)
  const [chatMeta,     setChatMeta]     = useState({})
  const [openMenuId,   setOpenMenuId]   = useState(null) // uid→{name,photo,username}

  // ─── استماع للمحادثات الفعّالة ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    )
    const unsub = onSnapshot(q, async (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.updatedAt?.seconds || 0
          const tb = b.updatedAt?.seconds || 0
          return tb - ta
        })
      setChats(list)
      // جلب بيانات المشاركين للمحادثات الفردية
      const meta = { ...chatMeta }
      for (const chat of list) {
        if (chat.type === 'private') {
          const otherId = chat.participants.find(p => p !== currentUser.uid)
          if (otherId && !meta[otherId]) {
            const snap2 = await getDoc(doc(db, 'users', otherId))
            if (snap2.exists()) {
              const d = snap2.data()
              meta[otherId] = { name: d.displayName, photo: d.photoURL, username: d.username }
            }
          }
        }
      }
      setChatMeta({ ...meta })
    })
    return unsub
  }, [currentUser])

  function getChatDisplay(chat) {
    if (chat.type === 'group') {
      return { name: chat.groupName, photo: chat.groupPhoto || '', isGroup: true }
    }
    const otherId = chat.participants.find(p => p !== currentUser.uid)
    const m = chatMeta[otherId] || {}
    return { name: m.name || '...', photo: m.photo || '', isGroup: false, otherId }
  }

  function formatTime(ts) {
    if (!ts) return ''
    try {
      return formatDistanceToNow(ts.toDate(), { addSuffix: false, locale: ar })
    } catch { return '' }
  }

  const filtered = chats.filter(c => {
    const d = getChatDisplay(c)
    return d.name?.toLowerCase().includes(search.toLowerCase())
  })

  async function handleDeleteFriend(e, chat) {
    e.stopPropagation()
    const otherId = chat.participants.find(p => p !== currentUser.uid)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { friends: arrayRemove(otherId) })
      await updateDoc(doc(db, 'users', otherId),         { friends: arrayRemove(currentUser.uid) })
      await deleteDoc(doc(db, 'chats', chat.id))
      if (activeChatId === chat.id) onCloseChat?.()
    } catch {
      // فشل الحذف بصمت
    }
  }

  async function handleLogout() {
    try { await logout() } catch {}
  }

  return (
    <aside className="flex flex-col h-full bg-chat-sidebar border-l border-chat-border w-full">

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-chat-header">
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar name={userProfile?.displayName} photo={userProfile?.photoURL} size={9} />
          <div className="text-right">
            <p className="text-chat-text font-semibold text-sm leading-tight">
              {userProfile?.displayName}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAdd(true)}
            title="إضافة صديق"
            className="p-2 text-chat-icon hover:text-teal-400 hover:bg-chat-hover rounded-full transition-colors"
          >
            <UserPlus size={19} />
          </button>
          <button
            onClick={() => setShowGroup(true)}
            title="إنشاء مجموعة"
            className="p-2 text-chat-icon hover:text-teal-400 hover:bg-chat-hover rounded-full transition-colors"
          >
            <Users size={19} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-chat-icon hover:text-chat-text hover:bg-chat-hover rounded-full transition-colors"
            >
              <MoreVertical size={19} />
            </button>
            {showMenu && (
              <div className="absolute left-0 top-full mt-1 bg-chat-input border border-chat-border rounded-xl shadow-xl z-50 min-w-[140px] overflow-hidden animate-fade-in">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-chat-hover transition-colors"
                >
                  <LogOut size={15} />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Search ──────────────────────────────────────────────────────────── */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={15} className="absolute top-2.5 right-3 text-chat-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث في المحادثات"
            className="w-full bg-chat-input text-chat-text placeholder-chat-muted rounded-lg py-2 pr-9 pl-3 text-sm outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>
      </div>

      {/* ─── Chat List ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-chat-muted text-sm gap-2">
            <MessageCircle size={36} className="opacity-30" />
            <p>لا توجد محادثات بعد</p>
            <p className="text-xs opacity-70">أضف صديقاً للبدء</p>
          </div>
        ) : (
          filtered.map(chat => {
            const display = getChatDisplay(chat)
            const isActive = chat.id === activeChatId
            const lastMsg  = chat.lastMessage
            let preview = ''
            if (lastMsg) {
              if (lastMsg.type === 'text')    preview = lastMsg.text || ''
              else if (lastMsg.type === 'image') preview = '📷 صورة'
              else if (lastMsg.type === 'video') preview = '🎥 فيديو'
              else if (lastMsg.type === 'voice') preview = '🎙️ رسالة صوتية'
              if (lastMsg.deletedForAll) preview = 'تم حذف هذه الرسالة'
            }

            const menuOpen = openMenuId === chat.id

            return (
              <div key={chat.id} className="relative group">
                <button
                  onClick={() => onSelectChat(chat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-right
                    ${isActive ? 'bg-chat-hover' : 'hover:bg-chat-hover/60'}`}
                >
                  <Avatar
                    name={display.name}
                    photo={display.photo}
                    isGroup={display.isGroup}
                    size={11}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-chat-text font-medium text-sm truncate">
                        {display.name}
                      </span>
                      {lastMsg?.timestamp && (
                        <span className="text-chat-muted text-xs shrink-0 mr-2">
                          {formatTime(lastMsg.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-chat-muted text-xs truncate mt-0.5">
                      {preview || 'ابدأ المحادثة'}
                    </p>
                  </div>
                  {chat.unread?.[currentUser.uid] > 0 && (
                    <span className="bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      {chat.unread[currentUser.uid]}
                    </span>
                  )}
                </button>

                {/* زر ⋮ يظهر عند hover */}
                {chat.type === 'private' && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : chat.id) }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-chat-icon hover:text-chat-text hover:bg-chat-hover rounded-full transition-all"
                    >
                      <MoreVertical size={15} />
                    </button>

                    {/* القائمة المنسدلة */}
                    {menuOpen && (
                      <div className="absolute left-0 top-full mt-1 bg-chat-input border border-chat-border rounded-xl shadow-xl z-50 min-w-[140px] overflow-hidden animate-fade-in">
                        <button
                          onClick={e => handleDeleteFriend(e, chat)}
                          className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-chat-hover transition-colors"
                        >
                          <Trash2 size={14} />
                          حذف الصديق
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modals */}
      {showProfile && <ProfileModal     onClose={() => setShowProfile(false)} />}
      {showAdd     && <AddFriendModal   onClose={() => setShowAdd(false)}   onChatOpen={onSelectChat} />}
      {showGroup   && <CreateGroupModal onClose={() => setShowGroup(false)} onChatOpen={onSelectChat} />}

      {/* Close menus on outside click */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
      {openMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
      )}
    </aside>
  )
}
