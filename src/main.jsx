import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter as BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1F2C33',
              color:      '#E9EDEF',
              fontFamily: 'Cairo, sans-serif',
              direction:  'rtl',
            },
            success: { iconTheme: { primary: '#0d9488', secondary: '#E9EDEF' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#E9EDEF' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
