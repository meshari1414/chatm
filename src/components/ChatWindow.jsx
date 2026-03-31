import { useEffect, useRef, useState } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  updateDoc, doc, arrayUnion,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import ChatHeader  from './ChatHeader'
import MessageBubble from './MessageBubble'
import MessageInput  from './MessageInput'
import { MessageCircle } from 'lucide-react'

export default function ChatWindow({ chat, onClose }) {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [imgView,  setImgView]  = useState(null)
  const bottomRef  = useRef(null)

  useEffect(() => {
    if (!chat) { setMessages([]); setLoading(false); return }
    setLoading(true)

    const q = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('timestamp', 'asc')
    )

    const unsub = onSnapshot(q, async (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMessages(msgs)
      setLoading(false)

      // تحديد الرسائل كمقروءة
      const unread = snap.docs.filter(d => {
        const data = d.data()
        return !data.readBy?.includes(currentUser.uid) && data.senderId !== currentUser.uid
      })
      for (const d of unread) {
        updateDoc(doc(db, 'chats', chat.id, 'messages', d.id), {
          readBy: arrayUnion(currentUser.uid),
        }).catch(() => {})
      }

      // طلب إذن الإشعارات إذا لم يُمنح بعد
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    })

    return unsub
  }, [chat?.id, currentUser.uid])

  // تمرير للأسفل عند وصول رسالة جديدة
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── حالة: لم يتم اختيار محادثة ─────────────────────────────────────────
  if (!chat) {
    return (
      <div className="flex-1 chat-bg flex flex-col items-center justify-center text-center p-8 select-none">
        <div className="w-24 h-24 rounded-full bg-teal-600/20 flex items-center justify-center mb-4">
          <MessageCircle size={48} className="text-teal-500 opacity-60" />
        </div>
        <h2 className="text-chat-text text-xl font-semibold opacity-80">مرحباً في ChatM</h2>
        <p className="text-chat-muted text-sm mt-2 max-w-xs">
          اختر محادثة من القائمة أو أضف صديقاً جديداً للبدء
        </p>
      </div>
    )
  }

  // ─── تجميع الرسائل حسب اليوم ────────────────────────────────────────────
  function groupByDay(msgs) {
    const groups = []
    let lastDate = ''
    for (const msg of msgs) {
      try {
        const d = msg.timestamp?.toDate()
        if (!d) { groups.push({ type: 'msg', msg }); continue }
        const dateStr = d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
        if (dateStr !== lastDate) {
          groups.push({ type: 'date', label: dateStr })
          lastDate = dateStr
        }
        groups.push({ type: 'msg', msg })
      } catch {
        groups.push({ type: 'msg', msg })
      }
    }
    return groups
  }

  const grouped = groupByDay(messages)

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ChatHeader chat={chat} onClose={onClose} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 chat-bg">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full spinner" />
          </div>
        ) : (
          <>
            {grouped.map((item, i) =>
              item.type === 'date' ? (
                <div key={`date-${i}`} className="flex justify-center my-3">
                  <span className="bg-chat-sidebar/80 text-chat-muted text-xs px-3 py-1 rounded-full">
                    {item.label}
                  </span>
                </div>
              ) : (
                <MessageBubble
                  key={item.msg.id}
                  msg={item.msg}
                  chatId={chat.id}
                  onImageClick={setImgView}
                />
              )
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <MessageInput chatId={chat.id} chatParticipants={chat.participants} />

      {/* Image viewer */}
      {imgView && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setImgView(null)}
        >
          <img
            src={imgView}
            alt="معاينة"
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setImgView(null)}
            className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
