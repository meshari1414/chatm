import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login    from './pages/Login'
import Register from './pages/Register'
import Home     from './pages/Home'

function PrivateRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/*"        element={<PrivateRoute><Home /></PrivateRoute>} />
    </Routes>
  )
}
