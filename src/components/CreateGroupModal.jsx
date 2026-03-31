import { useState } from 'react'
import {
  collection, doc, getDoc, getDocs, setDoc, serverTimestamp, query, where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { X, Users, Plus, Trash2 } from 'lucide-react'
import Avatar from './Avatar'

export default function CreateGroupModal({ onClose, onChatOpen }) {
  const { currentUser, userProfile } = useAuth()
  const [groupName,  setGroupName]  = useState('')
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState([]) // [{id, displayName, username, photoURL}]
  const [friends,    setFriends]    = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [creating,   setCreating]   = useState(false)

  async function loadFriends() {
    if (friends !== null) return
    setLoading(true)
    try {
      const ids = userProfile?.friends || []
      if (ids.length === 0) { setFriends([]); return }
      const snaps = await Promise.all(ids.map(id => getDoc(doc(db, 'users', id))))
      setFriends(snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() })))
    } catch { toast.error('حدث خطأ') }
    finally   { setLoading(false) }
  }

  // تحميل الأصدقاء عند فتح المودال
  if (friends === null) loadFriends()

  function toggleSelect(friend) {
    setSelected(prev =>
      prev.find(f => f.id === friend.id)
        ? prev.filter(f => f.id !== friend.id)
        : [...prev, friend]
    )
  }

  async function handleCreate() {
    if (!groupName.trim()) return toast.error('أدخل اسم المجموعة')
    if (selected.length < 1) return toast.error('أضف عضواً واحداً على الأقل')
    setCreating(true)
    try {
      const chatRef  = doc(collection(db, 'chats'))
      const members  = [currentUser.uid, ...selected.map(f => f.id)]
      await setDoc(chatRef, {
        type:         'group',
        groupName:    groupName.trim(),
        groupPhoto:   '',
        participants: members,
        createdBy:    currentUser.uid,
        admins:       [currentUser.uid],
        createdAt:    serverTimestamp(),
        updatedAt:    serverTimestamp(),
        lastMessage:  null,
      })
      toast.success('تم إنشاء المجموعة!')
      onChatOpen({ id: chatRef.id, type: 'group', participants: members, groupName: groupName.trim() })
      onClose()
    } catch { toast.error('حدث خطأ أثناء الإنشاء') }
    finally  { setCreating(false) }
  }

  const filteredFriends = (friends || []).filter(f =>
    f.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    f.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-chat-sidebar rounded-2xl w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-chat-border">
          <h3 className="text-chat-text font-semibold">إنشاء مجموعة</h3>
          <button onClick={onClose} className="text-chat-icon hover:text-chat-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Group name */}
          <input
            type="text"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="اسم المجموعة"
            maxLength={40}
            className="w-full bg-chat-input text-chat-text placeholder-chat-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-1 focus:ring-teal-600"
          />

          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map(f => (
                <div key={f.id} className="flex items-center gap-1.5 bg-teal-700/40 text-teal-300 rounded-full px-3 py-1 text-xs">
                  {f.displayName}
                  <button onClick={() => toggleSelect(f)}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Search friends */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في أصدقائك..."
            className="w-full bg-chat-input text-chat-text placeholder-chat-muted rounded-xl py-2 px-4 text-sm outline-none focus:ring-1 focus:ring-teal-600"
          />

          {/* Friends list */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex justify-center py-4">
                <span className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full spinner" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <p className="text-chat-muted text-sm text-center py-4">لا توجد أصدقاء بعد</p>
            ) : filteredFriends.map(f => {
              const isSelected = selected.find(s => s.id === f.id)
              return (
                <button
                  key={f.id}
                  onClick={() => toggleSelect(f)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-right
                    ${isSelected ? 'bg-teal-700/30' : 'hover:bg-chat-hover'}`}
                >
                  <Avatar name={f.displayName} photo={f.photoURL} size={9} />
                  <div className="flex-1 min-w-0">
                    <p className="text-chat-text text-sm font-medium truncate">{f.displayName}</p>
                    <p className="text-chat-muted text-xs">@{f.username}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${isSelected ? 'bg-teal-500 border-teal-500' : 'border-chat-border'}`}>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
          >
            {creating
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
              : <><Users size={17} /> إنشاء المجموعة ({selected.length + 1} أعضاء)</>}
          </button>
        </div>
      </div>
    </div>
  )
}
