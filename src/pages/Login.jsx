import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { MessageCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return toast.error('يرجى ملء جميع الحقول')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        : 'حدث خطأ، يرجى المحاولة مرة أخرى'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-chat-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-600 mb-4">
            <MessageCircle size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-teal-400">ChatM</h1>
          <p className="text-chat-muted mt-1 text-sm">تواصل مع من تحب</p>
        </div>

        {/* Card */}
        <div className="bg-chat-sidebar rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-chat-text mb-6 text-center">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-chat-muted text-sm mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={16} className="absolute top-3 right-3 text-chat-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full bg-chat-input text-chat-text placeholder-chat-muted rounded-xl py-2.5 pr-9 pl-3 text-sm input-focus border border-chat-border focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-chat-muted text-sm mb-1">كلمة المرور</label>
              <div className="relative">
                <Lock size={16} className="absolute top-3 right-3 text-chat-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-chat-input text-chat-text placeholder-chat-muted rounded-xl py-2.5 pr-9 pl-9 text-sm input-focus border border-chat-border focus:border-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute top-2.5 left-3 text-chat-icon hover:text-chat-text transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
              ) : 'دخول'}
            </button>

          </form>

          <p className="text-center text-chat-muted text-sm mt-5">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
              سجّل الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
