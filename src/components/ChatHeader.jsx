import { useState, useEffect } from 'react'
import { doc, getDoc, onSnapshot, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { MoreVertical, UserX, ArrowRight, Info } from 'lucide-react'
import Avatar from './Avatar'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

export default function ChatHeader({ chat, onClose }) {
  const { currentUser } = useAuth()
  const [otherUser, setOtherUser] = useState(null)
  const [showMenu,  setShowMenu]  = useState(false)
  const [showInfo,  setShowInfo]  = useState(false)
  const [members,   setMembers]   = useState([])

  useEffect(() => {
    if (!chat) return
    if (chat.type === 'private') {
      const otherId = chat.participants.find(p => p !== currentUser.uid)
      if (!otherId) return
      // استماع فوري لحالة الطرف الآخر
      const unsub = onSnapshot(doc(db, 'users', otherId), snap => {
        if (snap.exists()) setOtherUser({ id: snap.id, ...snap.data() })
      })
      return unsub
    } else if (chat.type === 'group') {
      // جلب أعضاء المجموعة
      Promise.all(
        chat.participants.map(id => getDoc(doc(db, 'users', id)))
      ).then(snaps => {
        setMembers(snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() })))
      })
    }
  }, [chat, currentUser.uid])

  function getLastSeen(ts) {
    if (!ts) return 'غير متاح'
    try {
      return 'آخر ظهور ' + formatDistanceToNow(ts.toDate(), { addSuffix: true, locale: ar })
    } catch { return '' }
  }

  async function handleRemoveFriend() {
    if (!otherUser) return
    const confirm = window.confirm(`هل تريد حذف ${otherUser.displayName} من أصدقائك؟`)
    if (!confirm) return
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { friends: arrayRemove(otherUser.id) })
      await updateDoc(doc(db, 'users', otherUser.id), { friends: arrayRemove(currentUser.uid) })
      toast.success('تم حذف الصديق')
      onClose()
    } catch { toast.error('حدث خطأ') }
    setShowMenu(false)
  }

  if (!chat) return null

  const isGroup  = chat.type === 'group'
  const name     = isGroup ? chat.groupName : otherUser?.displayName || '...'
  const photo    = isGroup ? chat.groupPhoto : otherUser?.photoURL
  const subtitle = isGroup
    ? `${chat.participants?.length} أعضاء`
    : getLastSeen(otherUser?.lastSeen)

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 bg-chat-header border-b border-chat-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={onClose} className="text-chat-icon hover:text-chat-text md:hidden transition-colors">
            <ArrowRight size={20} />
          </button>
          <button
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-3 flex-1 min-w-0 text-right"
          >
            <Avatar name={name} photo={photo} isGroup={isGroup} size={10} />
            <div className="min-w-0">
              <p className="text-chat-text font-semibold text-sm leading-tight truncate">{name}</p>
              <p className="text-chat-muted text-xs truncate">{subtitle}</p>
            </div>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-chat-icon hover:text-chat-text hover:bg-chat-hover rounded-full transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute left-0 top-full mt-1 bg-chat-input border border-chat-border rounded-xl shadow-xl z-50 min-w-[160px] overflow-hidden animate-fade-in">
              <button
                onClick={() => { setShowInfo(true); setShowMenu(false) }}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-chat-text hover:bg-chat-hover transition-colors"
              >
                <Info size={15} />
                {isGroup ? 'تفاصيل المجموعة' : 'تفاصيل جهة الاتصال'}
              </button>
              {!isGroup && (
                <button
                  onClick={handleRemoveFriend}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-chat-hover transition-colors border-t border-chat-border"
                >
                  <UserX size={15} />
                  حذف من الأصدقاء
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Info modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowInfo(false)}>
          <div className="bg-chat-sidebar rounded-2xl w-full max-w-xs p-6 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <Avatar name={name} photo={photo} isGroup={isGroup} size={16} />
            <h3 className="text-chat-text font-bold text-lg mt-3">{name}</h3>
            {!isGroup && <p className="text-chat-muted text-sm mt-1">@{otherUser?.username}</p>}
            {isGroup && (
              <div className="mt-4 text-right">
                <p className="text-chat-muted text-xs mb-2">الأعضاء ({members.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <Avatar name={m.displayName} size={8} />
                      <div>
                        <p className="text-chat-text text-sm">{m.displayName}</p>
                        <p className="text-chat-muted text-xs">@{m.username}</p>
                      </div>
                      {chat.admins?.includes(m.id) && (
                        <span className="mr-auto text-teal-400 text-xs bg-teal-900/40 px-2 py-0.5 rounded-full">
                          مشرف
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => setShowInfo(false)}
              className="mt-5 w-full bg-chat-input hover:bg-chat-hover text-chat-text rounded-xl py-2.5 text-sm transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}
    </>
  )
}
