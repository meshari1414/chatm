import { useState, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import Avatar from './Avatar'
import { X, Camera, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const CLOUDINARY_CLOUD  = 'dtfv6kh2v'
const CLOUDINARY_PRESET = 'id4ov5rt'

export default function ProfileModal({ onClose }) {
  const { currentUser, userProfile, setUserProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('يرجى اختيار صورة')
    if (file.size > 5 * 1024 * 1024) return toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت')

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_PRESET)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
        { method: 'POST', body: formData }
      )
      if (!res.ok) throw new Error('upload failed')
      const data = await res.json()
      await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: data.secure_url })
      setUserProfile(prev => ({ ...prev, photoURL: data.secure_url }))
      toast.success('تم تحديث الصورة بنجاح')
    } catch {
      toast.error('فشل رفع الصورة')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-chat-sidebar rounded-2xl w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-chat-border">
          <h3 className="text-chat-text font-semibold">الملف الشخصي</h3>
          <button onClick={onClose} className="text-chat-icon hover:text-chat-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col items-center gap-5">

          {/* Avatar */}
          <div className="relative">
            <Avatar name={userProfile?.displayName} photo={userProfile?.photoURL} size={16} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 left-0 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 rounded-full p-1.5 text-white transition-colors"
            >
              {uploading
                ? <Loader size={14} className="spinner" />
                : <Camera size={14} />}
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

          {/* Info */}
          <div className="text-center space-y-1">
            <p className="text-chat-text font-bold text-lg">{userProfile?.displayName}</p>
            <p className="text-chat-muted text-sm">@{userProfile?.username}</p>
            <p className="text-chat-muted text-xs">{userProfile?.email}</p>
          </div>

          <p className="text-chat-muted text-xs text-center opacity-60">
            اضغط على أيقونة الكاميرا لتغيير الصورة
          </p>
        </div>
      </div>
    </div>
  )
}
