import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc, setDoc, getDoc, query, collection, where, getDocs, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null)
  const [userProfile, setUserProfile]   = useState(null)
  const [loading,     setLoading]       = useState(true)

  // ─── تسجيل حساب جديد ──────────────────────────────────────────────────────
  async function register(email, password, username, displayName) {
    // التحقق من أن الـ username غير مستخدم
    const q     = query(collection(db, 'users'), where('username', '==', username.toLowerCase()))
    const snap  = await getDocs(q)
    if (!snap.empty) throw new Error('اسم المستخدم مستخدم بالفعل')

    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const uid  = cred.user.uid

    const profile = {
      uid,
      email,
      username:    username.toLowerCase(),
      displayName: displayName.trim(),
      photoURL:    '',
      createdAt:   serverTimestamp(),
      lastSeen:    serverTimestamp(),
      friends:     [],
      fcmToken:    '',
    }

    await setDoc(doc(db, 'users', uid), profile)
    return cred
  }

  // ─── تسجيل الدخول ─────────────────────────────────────────────────────────
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // ─── تسجيل الخروج ─────────────────────────────────────────────────────────
  async function logout() {
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        lastSeen: serverTimestamp(),
      })
    }
    return signOut(auth)
  }

  // ─── جلب بروفايل المستخدم ─────────────────────────────────────────────────
  async function fetchProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      const data = snap.data()
      setUserProfile(data)
      return data
    }
    return null
  }

  // ─── تحديث آخر ظهور ───────────────────────────────────────────────────────
  async function updateLastSeen() {
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        lastSeen: serverTimestamp(),
      })
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        await fetchProfile(user.uid)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    loading,
    register,
    login,
    logout,
    fetchProfile,
    updateLastSeen,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
