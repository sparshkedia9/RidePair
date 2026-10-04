/* Auth state for the whole app: who is logged in, and how to log in/out.
   Screens call useAuth() instead of touching localStorage directly. */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, saveSession, clearSession, getToken, getStoredUser } from '../lib/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Start from the stored user so a refresh doesn't flash the login screen.
  const [user, setUser] = useState(() => getStoredUser())
  const [booting, setBooting] = useState(true)

  // Confirm the stored token is still valid before trusting it.
  useEffect(() => {
    let cancelled = false
    async function verify() {
      if (!getToken()) { setBooting(false); return }
      try {
        const fresh = await api.me()
        if (!cancelled) setUser(fresh)
      } catch {
        if (!cancelled) { clearSession(); setUser(null) }
      } finally {
        if (!cancelled) setBooting(false)
      }
    }
    verify()
    return () => { cancelled = true }
  }, [])

  // api.js fires this when any request comes back 401.
  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('ridepair:logout', onLogout)
    return () => window.removeEventListener('ridepair:logout', onLogout)
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await api.login(credentials)
    saveSession(data.access_token, data.user)
    setUser(data.user)
    return data.user
  }, [])

  const signup = useCallback(async (payload) => {
    const data = await api.signup(payload)
    saveSession(data.access_token, data.user)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, booting, login, signup, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
