import { useState } from 'react'
import {
  collection, query, where, getDocs,
  doc, updateDoc, arrayUnion, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { X, Search, UserPlus, MessageCircle } from 'lucide-react'
import Avatar from './Avatar'

export default function AddFriendModal({ onClose, onChatOpen }) {
  const { currentUser, userProfile, setUserProfile } = useAuth()
  const [searchVal, setSearchVal] = useState('')
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [adding,    setAdding]    = useState(false)

  async function handleSearch() {
    const val = searchVal.trim().toLowerCase()
    if (!val) return
    if (val === userProfile?.username) return toast.error('لا يمكنك إضافة نفسك')
    setLoading(true)
    setResult(null)
    try {
      const q    = query(collection(db, 'users'), where('username', '==', val))
      const snap = await getDocs(q)
      if (snap.empty) {
        toast.error('لم يُعثر على مستخدم بهذا الاسم')
      } else {
        setResult({ id: snap.docs[0].id, ...snap.docs[0].data() })
      }
    } catch { toast.error('حدث خطأ') }
    finally   { setLoading(false) }
  }

  async function handleAdd() {
    if (!result) return
    setAdding(true)
    try {
      // إضافة الصديق لكلا الطرفين
      await updateDoc(doc(db, 'users', currentUser.uid), { friends: arrayUnion(result.id) })
      await updateDoc(doc(db, 'users', result.id), { friends: arrayUnion(currentUser.uid) })

      // إنشاء محادثة فردية إن لم تكن موجودة
      const chatId = [currentUser.uid, result.id].sort().join('_')
      const chatRef = doc(db, 'chats', chatId)
      const chatSnap = await getDoc(chatRef)
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          type:        'private',
          participants: [currentUser.uid, result.id],
          createdAt:   serverTimestamp(),
          updatedAt:   serverTimestamp(),
          lastMessage: null,
        })
      }

      // تحديث بروفايل محلي
      setUserProfile(prev => ({
        ...prev,
        friends: [...(prev?.friends || []), result.id],
      }))

      toast.success(`تمت إضافة ${result.displayName}!`)

      // فتح المحادثة مباشرة
      onChatOpen({ id: chatId, type: 'private', participants: [currentUser.uid, result.id] })
      onClose()
    } catch { toast.error('حدث خطأ أثناء الإضافة') }
    finally  { setAdding(false) }
  }

  const isAlreadyFriend = result && userProfile?.friends?.includes(result.id)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-chat-sidebar rounded-2xl w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-chat-border">
          <h3 className="text-chat-text font-semibold">إضافة صديق</h3>
          <button onClick={onClose} className="text-chat-icon hover:text-chat-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-chat-muted text-sm">ابحث باسم المستخدم لإضافة صديق جديد</p>

          {/* Search input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value.toLowerCase())}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="اسم المستخدم..."
              className="flex-1 bg-chat-input text-chat-text placeholder-chat-muted rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-1 focus:ring-teal-600"
              dir="ltr"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchVal.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl px-4 transition-colors"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner block" />
              ) : <Search size={17} />}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="flex items-center gap-3 bg-chat-input rounded-xl p-4 animate-fade-in">
              <Avatar name={result.displayName} photo={result.photoURL} size={11} />
              <div className="flex-1 min-w-0">
                <p className="text-chat-text font-semibold text-sm">{result.displayName}</p>
                <p className="text-chat-muted text-xs">@{result.username}</p>
              </div>
              {isAlreadyFriend ? (
                <button
                  onClick={() => { onChatOpen({ id: [currentUser.uid, result.id].sort().join('_'), type: 'private', participants: [currentUser.uid, result.id] }); onClose() }}
                  className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs rounded-lg px-3 py-2 transition-colors"
                >
                  <MessageCircle size={14} />
                  محادثة
                </button>
              ) : (
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs rounded-lg px-3 py-2 transition-colors"
                >
                  {adding
                    ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full spinner block" />
                    : <><UserPlus size={14} /> إضافة</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
