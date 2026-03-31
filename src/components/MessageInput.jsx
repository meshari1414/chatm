import { useState, useRef } from 'react'
import {
  collection, addDoc, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const CLOUDINARY_CLOUD  = 'dtfv6kh2v'
const CLOUDINARY_PRESET = 'id4ov5rt'
import { useAuth } from '../contexts/AuthContext'
import { Send, Paperclip, Mic, MicOff, Image, Video, X, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessageInput({ chatId, chatParticipants }) {
  const { currentUser } = useAuth()
  const [text,        setText]        = useState('')
  const [uploading,   setUploading]   = useState(false)
  const [recording,   setRecording]   = useState(false)
  const [showAttach,  setShowAttach]  = useState(false)
  const [uploadPct,   setUploadPct]   = useState(0)
  const fileInputRef  = useRef(null)
  const videoInputRef = useRef(null)
  const mediaRecRef   = useRef(null)
  const chunksRef     = useRef([])

  // ─── إرسال رسالة نصية ────────────────────────────────────────────────────
  async function sendText() {
    const t = text.trim()
    if (!t) return
    setText('')
    await postMessage({ type: 'text', text: t })
  }

  // ─── نشر رسالة في Firestore ───────────────────────────────────────────────
  async function postMessage(payload) {
    const msgRef = collection(db, 'chats', chatId, 'messages')
    const msgData = {
      ...payload,
      senderId:     currentUser.uid,
      timestamp:    serverTimestamp(),
      deletedFor:   [],
      deletedForAll: false,
      readBy:       [currentUser.uid],
    }
    await addDoc(msgRef, msgData)

    // تحديث آخر رسالة في المحادثة
    const preview = payload.type === 'text' ? payload.text
      : payload.type === 'image' ? 'صورة'
      : payload.type === 'video' ? 'فيديو'
      : 'رسالة صوتية'

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: {
        text:      preview,
        type:      payload.type,
        senderId:  currentUser.uid,
        timestamp: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    })

    // إشعار المشاركين الآخرين (browser notification)
    notifyOthers(preview)
  }

  // ─── إشعار المتصفح ───────────────────────────────────────────────────────
  function notifyOthers(preview) {
    if (Notification.permission === 'granted' && document.hidden) {
      new Notification('ChatM — رسالة جديدة', {
        body: preview,
        icon: '/logo.svg',
      })
    }
  }

  // ─── رفع ملف (صورة أو فيديو) عبر Cloudinary ─────────────────────────────
  async function uploadFile(file, type) {
    setUploading(true)
    setUploadPct(0)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_PRESET)

      const resourceType = type === 'video' ? 'video' : 'image'
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )
      if (!res.ok) throw new Error('upload failed')
      const data = await res.json()
      setUploadPct(100)
      await postMessage({ type, mediaUrl: data.secure_url })
    } catch { toast.error('فشل رفع الملف') }
    finally   { setUploading(false); setUploadPct(0) }
  }

  // ─── تسجيل صوت ───────────────────────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec    = new MediaRecorder(stream)
      mediaRecRef.current  = rec
      chunksRef.current    = []
      rec.ondataavailable  = e => chunksRef.current.push(e.data)
      rec.onstop           = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await uploadVoice(blob)
      }
      rec.start()
      setRecording(true)
    } catch { toast.error('تعذّر الوصول إلى الميكروفون') }
  }

  function stopRecording() {
    mediaRecRef.current?.stop()
    setRecording(false)
  }

  async function uploadVoice(blob) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', blob, 'voice.webm')
      formData.append('upload_preset', CLOUDINARY_PRESET)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/video/upload`,
        { method: 'POST', body: formData }
      )
      if (!res.ok) throw new Error('upload failed')
      const data = await res.json()
      await postMessage({ type: 'voice', mediaUrl: data.secure_url })
    } catch { toast.error('فشل إرسال الرسالة الصوتية') }
    finally   { setUploading(false) }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendText()
    }
  }

  return (
    <div className="px-3 py-2 bg-chat-input border-t border-chat-border">
      {/* Upload progress bar */}
      {uploading && (
        <div className="mb-2 rounded-full overflow-hidden h-1 bg-chat-border">
          <div
            className="h-full bg-teal-500 transition-all duration-200"
            style={{ width: `${uploadPct}%` }}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attach */}
        <div className="relative">
          <button
            onClick={() => setShowAttach(!showAttach)}
            disabled={uploading || recording}
            className="p-2 text-chat-icon hover:text-teal-400 transition-colors disabled:opacity-40"
          >
            <Paperclip size={21} />
          </button>
          {showAttach && (
            <>
              <div className="absolute bottom-full mb-2 right-0 bg-chat-sidebar border border-chat-border rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
                <button
                  onClick={() => { fileInputRef.current?.click(); setShowAttach(false) }}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-chat-text hover:bg-chat-hover w-full transition-colors"
                >
                  <Image size={18} className="text-teal-400" />
                  صورة
                </button>
                <button
                  onClick={() => { videoInputRef.current?.click(); setShowAttach(false) }}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-chat-text hover:bg-chat-hover w-full border-t border-chat-border transition-colors"
                >
                  <Video size={18} className="text-teal-400" />
                  فيديو
                </button>
              </div>
              <div className="fixed inset-0 z-40" onClick={() => setShowAttach(false)} />
            </>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files[0]; if (f) uploadFile(f, 'image'); e.target.value = '' }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={e => { const f = e.target.files[0]; if (f) uploadFile(f, 'video'); e.target.value = '' }}
        />

        {/* Text area */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={uploading ? 'جاري الرفع...' : recording ? 'جاري التسجيل...' : 'اكتب رسالة...'}
          disabled={uploading || recording}
          rows={1}
          className="flex-1 bg-chat-sidebar text-chat-text placeholder-chat-muted rounded-2xl py-2.5 px-4 text-sm resize-none outline-none focus:ring-1 focus:ring-teal-600 max-h-32 disabled:opacity-50 transition-all"
          style={{ direction: 'rtl' }}
        />

        {/* Send / Mic */}
        {text.trim() ? (
          <button
            onClick={sendText}
            disabled={uploading}
            className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-full text-white transition-colors"
          >
            <Send size={19} />
          </button>
        ) : uploading ? (
          <div className="p-2.5">
            <Loader size={19} className="text-teal-400 spinner" />
          </div>
        ) : recording ? (
          <button
            onClick={stopRecording}
            className="p-2.5 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
          >
            <div className="record-pulse">
              <MicOff size={19} />
            </div>
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={uploading}
            className="p-2.5 text-chat-icon hover:text-teal-400 disabled:opacity-40 transition-colors"
          >
            <Mic size={21} />
          </button>
        )}
      </div>
    </div>
  )
}
