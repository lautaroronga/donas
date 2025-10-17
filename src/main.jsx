import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Admin from './admin'
import LoginAdmin from './LoginAdmin'
import './index.css'

// ✅ Solo importás auth desde tu config
import { auth } from './firebase/config'
import { onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth'

setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("🔐 Persistencia configurada: solo durante la sesión del navegador")
  })
  .catch((error) => {
    console.error("Error configurando persistencia:", error)
  })

function MainRouter() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioActual) => {
      setUser(usuarioActual)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) return <p>Cargando...</p>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        {/* 🔒 Si hay usuario logueado, muestra Admin; si no, pide login */}
        <Route path="/admin" element={user ? <Admin /> : <LoginAdmin />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MainRouter />
  </React.StrictMode>
)
