const TOKEN_KEY = 'ragforge_token'

// In local dev, this is empty and requests go to '/api/...', which Vite's
// dev server proxies to localhost:8000 (see vite.config.js). In production,
// set VITE_API_BASE_URL to your deployed backend's URL (e.g. a Render URL)
// at build time, and requests become absolute instead of relative.
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export function getToken() {
  return localStorage_safe_get()
}

// NOTE: artifacts environments disallow localStorage, but this is a real
// standalone Vite app running in the user's own browser, so localStorage
// is the correct and normal choice here for a JWT session token.
function localStorage_safe_get() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const token = getToken()
  const headers = {}
  if (!isForm) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const message = data?.detail || `Request failed with status ${res.status}`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }
  return data
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  listDocuments: () => request('/documents'),
  uploadDocument: (file) => {
    const form = new FormData()
    form.append('file', file)
    return request('/documents/upload', { method: 'POST', body: form, isForm: true })
  },
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

  listSessions: () => request('/chat/sessions'),
  getSessionMessages: (id) => request(`/chat/sessions/${id}/messages`),
  sendChat: (payload) => request('/chat', { method: 'POST', body: payload }),

  runEval: (payload) => request('/eval/run', { method: 'POST', body: payload }),
  evalSummary: () => request('/eval/summary'),

  analyticsOverview: () => request('/analytics/overview'),
}
