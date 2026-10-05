export const API = import.meta.env.VITE_API_BASE

export const getToken = () => localStorage.getItem('token')
// profile: {kind:'teacher', email} | {kind:'session', expires_at}
export const getProfile = () => JSON.parse(localStorage.getItem('asri_profile') || 'null')
export const getKind = () => getProfile()?.kind || null
// ponytail: read per render, no subscriptions — single shared class session; add store when live multi-user state appears

function parseOrThrow(text, res, fallback) {
  let data
  try { data = text ? JSON.parse(text) : {} } catch { throw new Error(text.slice(0, 120) || `HTTP ${res.status}`) }
  if (!res.ok) throw new Error(data.error || fallback)
  return data
}

export async function teacherLogin(email, password) {
  const res = await fetch(`${API}/teachers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = parseOrThrow(await res.text(), res, 'Login failed')
  localStorage.setItem('token', data.token)
  localStorage.setItem('asri_profile', JSON.stringify({ kind: 'teacher', email: data.user?.email || email }))
  return data
}

// validatePin exchanges a 6-char classroom code for a session opening the whole book.
export async function validatePin(code) {
  const res = await fetch(`${API}/access/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  })
  const data = parseOrThrow(await res.text(), res, 'Invalid or expired code')
  localStorage.setItem('token', data.token)
  localStorage.setItem('asri_profile', JSON.stringify({ kind: 'session', expires_at: data.expires_at }))
  return data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('asri_profile')
  localStorage.removeItem('user')
  // Shared desktops: practice aggregates must not leak into the next class.
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i)
    if (k?.startsWith('asri_chapter_') || k?.startsWith('asri_verdict_') || k?.startsWith('asri_reflect_')) localStorage.removeItem(k)
  }
}

export async function authFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (opts.body && !headers['Content-Type'] && typeof opts.body === 'string') headers['Content-Type'] = 'application/json'
  const r = await fetch(`${API}${path}`, { ...opts, headers })
  const text = await r.text()
  let json
  try { json = text ? JSON.parse(text) : {} } catch { json = { raw: text } }
  if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`)
  return json
}
