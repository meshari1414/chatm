import { useState, useRef } from 'react'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Trash2, ChevronDown, Play, Pause, Check, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessageBubble({ msg, chatId, onImageClick }) {
  const { currentUser } = useAuth()
  const isSent  = msg.senderId === currentUser.uid
  const [menu,      setMenu]      = useState(false)
  const [playing,   setPlaying]   = useState(false)
  const audioRef = useRef(null)

  // ─── حذف الرسالة ─────────────────────────────────────────────────────────
  async function deleteForMe() {
    await updateDoc(doc(db, 'chats', chatId, 'messages', msg.id), {
      deletedFor: arrayUnion(currentUser.uid),
    })
    setMenu(false)
  }

  async function deleteForAll() {
    await updateDoc(doc(db, 'chats', chatId, 'messages', msg.id), {
      deletedForAll: true,
    })
    setMenu(false)
    toast.success('تم حذف الرسالة للجميع')
  }

  // ─── تشغيل الصوت ─────────────────────────────────────────────────────────
  function toggleAudio() {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  function formatTime(ts) {
    if (!ts) return ''
    try { return format(ts.toDate(), 'HH:mm') } catch { return '' }
  }

  // ─── الرسالة محذوفة للجميع ───────────────────────────────────────────────
  if (msg.deletedForAll) {
    return (
      <div className={`flex ${isSent ? 'justify-start' : 'justify-end'} mb-1`}>
        <div className="bg-chat-input/60 rounded-xl px-4 py-2 text-chat-muted text-xs italic max-w-xs">
          🚫 تم حذف هذه الرسالة
        </div>
      </div>
    )
  }

  // ─── الرسالة محذوفة بالنسبة لي ──────────────────────────────────────────
  if (msg.deletedFor?.includes(currentUser.uid)) return null

  const bubbleBase = `relative max-w-xs sm:max-w-sm md:max-w-md rounded-2xl px-3 py-2 shadow-sm message-enter`
  const sentStyle  = `${bubbleBase} bg-chat-sent text-chat-text rounded-br-sm bubble-sent ml-2`
  const recvStyle  = `${bubbleBase} bg-chat-received text-chat-text rounded-bl-sm bubble-received mr-2`

  return (
    <div className={`flex ${isSent ? 'justify-start' : 'justify-end'} mb-1 group`}>
      <div className={`flex flex-col ${isSent ? 'items-start' : 'items-end'}`}>
        <div className={isSent ? sentStyle : recvStyle}>

          {/* ─── Text ───────────────────────────────────────────────────── */}
          {msg.type === 'text' && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
          )}

          {/* ─── Image ──────────────────────────────────────────────────── */}
          {msg.type === 'image' && (
            <img
              src={msg.mediaUrl}
              alt="صورة"
              className="media-thumb cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick?.(msg.mediaUrl)}
              onError={e => { e.target.style.display = 'none' }}
            />
          )}

          {/* ─── Video ──────────────────────────────────────────────────── */}
          {msg.type === 'video' && (
            <video
              src={msg.mediaUrl}
              controls
              className="media-thumb"
            />
          )}

          {/* ─── Voice ──────────────────────────────────────────────────── */}
          {msg.type === 'voice' && (
            <div className="flex items-center gap-3 min-w-[160px]">
              <button
                onClick={toggleAudio}
                className="w-9 h-9 rounded-full bg-teal-600 hover:bg-teal-500 flex items-center justify-center transition-colors shrink-0"
              >
                {playing ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" />}
              </button>
              <div className="flex-1">
                <div className="flex items-end gap-0.5 h-6">
                  {[3,5,8,6,4,7,5,3,6,8,4,5].map((h, i) => (
                    <div key={i} className="bg-teal-400/60 rounded-full w-1" style={{ height: `${h * 2}px` }} />
                  ))}
                </div>
              </div>
              <audio
                ref={audioRef}
                src={msg.mediaUrl}
                onEnded={() => setPlaying(false)}
                className="hidden"
              />
            </div>
          )}

          {/* ─── Time + status ──────────────────────────────────────────── */}
          <div className={`flex items-center gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-chat-muted">{formatTime(msg.timestamp)}</span>
            {isSent && (
              msg.readBy?.length > 1
                ? <CheckCheck size={12} className="text-teal-400" />
                : <Check size={12} className="text-chat-muted" />
            )}
          </div>

          {/* ─── Delete menu trigger ─────────────────────────────────────── */}
          <button
            onClick={() => setMenu(!menu)}
            className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full p-0.5"
          >
            <ChevronDown size={12} className="text-white" />
          </button>
        </div>

        {/* ─── Context Menu ──────────────────────────────────────────────── */}
        {menu && (
          <>
            <div className="bg-chat-input border border-chat-border rounded-xl shadow-xl overflow-hidden z-40 animate-fade-in mt-1">
              <button
                onClick={deleteForMe}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-chat-text hover:bg-chat-hover w-full transition-colors"
              >
                <Trash2 size={14} className="text-yellow-400" />
                احذف منّي
              </button>
              {isSent && (
                <button
                  onClick={deleteForAll}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-chat-hover w-full transition-colors border-t border-chat-border"
                >
                  <Trash2 size={14} />
                  احذف من الجميع
                </button>
              )}
            </div>
            <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
          </>
        )}
      </div>
    </div>
  )
}
