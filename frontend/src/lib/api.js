/* ═══════════════════════════════════════════════════════════
   api.js — the single door to the FastAPI backend.

   Every network call in the app goes through request(), so the
   auth token is attached in exactly one place and an expired
   session is handled exactly once.
   ═══════════════════════════════════════════════════════════ */

const TOKEN_KEY = 'ridepair_token'
const USER_KEY = 'ridepair_user'

/* ---------- session ---------- */
export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export function saveSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch { /* private browsing — session just won't persist */ }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch { /* ignore */ }
}

/* Raised on any non-2xx so screens can `catch (e) { toast(e.message) }`. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/* ---------- the one request function ---------- */
async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach the server. Is it still running?', 0)
  }

  // Session died — let the AuthProvider bounce the user to login.
  if (res.status === 401 && token) {
    clearSession()
    window.dispatchEvent(new CustomEvent('ridepair:logout'))
    throw new ApiError('Your session expired. Please log in again.', 401)
  }

  let data = null
  const text = await res.text()
  if (text) { try { data = JSON.parse(text) } catch { data = null } }

  if (!res.ok) {
    let msg = 'Something went wrong. Try again.'
    if (data && typeof data.detail === 'string') {
      msg = data.detail
    } else if (data && Array.isArray(data.detail) && data.detail.length) {
      // FastAPI validation error — surface the first offending field.
      const d = data.detail[0]
      const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : 'input'
      msg = `${field}: ${d.msg}`
    }
    throw new ApiError(msg, res.status)
  }
  return data
}

/* ---------- endpoints ---------- */
export const api = {
  meta: () => request('GET', '/api/meta'),
  campusStats: () => request('GET', '/api/rides/campus-stats'),

  signup: (payload) => request('POST', '/api/auth/signup', payload),
  login: (payload) => request('POST', '/api/auth/login', payload),
  me: () => request('GET', '/api/auth/me'),

  postRide: (payload) => request('POST', '/api/rides', payload),
  match: (query) => request('POST', '/api/rides/match', query),
  join: (rideId) => request('POST', `/api/rides/${rideId}/join`),
  dashboard: () => request('GET', '/api/rides/dashboard'),
  getRide: (rideId) => request('GET', `/api/rides/${rideId}`),
}
