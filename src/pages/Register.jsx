import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { MessageCircle, Mail, Lock, User, AtSign, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const [displayName, setDisplayName] = useState('')
  const [username,    setUsername]    = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const { register } = useAuth()
  const navigate     = useNavigate()

  function validateUsername(u) {
    return /^[a-z0-9_]{3,20}$/.test(u)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!displayName || !username || !email || !password || !confirm)
      return toast.error('يرجى ملء جميع الحقول')
    if (!validateUsername(username))
      return toast.error('اسم المستخدم: 3-20 حرف، أرقام وشرطة سفلية فقط')
    if (password.length < 6)
      return toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    if (password !== confirm)
      return toast.error('كلمتا المرور غير متطابقتين')

    setLoading(true)
    try {
      await register(email, password, username, displayName)
      toast.success('تم إنشاء الحساب بنجاح!')
      navigate('/')
    } catch (err) {
      const msg = err.message.includes('مستخدم بالفعل')
        ? err.message
        : err.code === 'auth/email-already-in-use'
          ? 'البريد الإلكتروني مستخدم بالفعل'
          : 'حدث خطأ، يرجى المحاولة مرة أخرى'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-chat-input text-chat-text placeholder-chat-muted rounded-xl py-2.5 text-sm input-focus border border-chat-border focus:border-teal-500 transition-colors"

  return (
    <div className="min-h-screen bg-chat-bg flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-600 mb-3">
            <MessageCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-teal-400">ChatM</h1>
        </div>

        {/* Card */}
        <div className="bg-chat-sidebar rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-chat-text mb-5 text-center">إنشاء حساب جديد</h2>

          <form onSubmit={handleSubmit} className="space-y-3.5">

            {/* Display Name */}
            <div>
              <label className="block text-chat-muted text-xs mb-1">الاسم الظاهر</label>
              <div className="relative">
                <User size={15} className="absolute top-3 right-3 text-chat-icon" />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="اسمك الكامل"
                  className={`${inputClass} pr-9 pl-3`}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-chat-muted text-xs mb-1">اسم المستخدم</label>
              <div className="relative">
                <AtSign size={15} className="absolute top-3 right-3 text-chat-icon" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase())}
                  placeholder="username"
                  className={`${inputClass} pr-9 pl-3`}
                  dir="ltr"
                />
              </div>
              <p className="text-chat-muted text-xs mt-1 pr-1">أحرف إنجليزية صغيرة، أرقام، شرطة سفلية (3-20 حرف)</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-chat-muted text-xs mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={15} className="absolute top-3 right-3 text-chat-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className={`${inputClass} pr-9 pl-3`}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-chat-muted text-xs mb-1">كلمة المرور</label>
              <div className="relative">
                <Lock size={15} className="absolute top-3 right-3 text-chat-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className={`${inputClass} pr-9 pl-9`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute top-2.5 left-3 text-chat-icon hover:text-chat-text transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-chat-muted text-xs mb-1">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock size={15} className="absolute top-3 right-3 text-chat-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  className={`${inputClass} pr-9 pl-3`}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors flex items-center justify-center mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
              ) : 'إنشاء الحساب'}
            </button>

          </form>

          <p className="text-center text-chat-muted text-sm mt-4">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
              سجّل دخولك
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
