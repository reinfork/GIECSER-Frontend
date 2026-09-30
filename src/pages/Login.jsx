import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../auth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@test.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await login(email, password); navigate('/dashboard') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h1 className="text-xl font-bold">Login to Asri</h1>
        <p className="text-sm text-slate-500 mb-4">ASR English practice — masuk untuk dashboard</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="admin@test.com" className="mt-1 w-full border rounded px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="••••••••" className="mt-1 w-full border rounded px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-violet-600 text-white rounded py-2 text-sm font-medium disabled:opacity-50">{loading ? 'Loading...' : 'Login'}</button>
        </form>
        <div className="text-sm text-center text-slate-500 mt-4">No account? <Link to="/register" className="text-violet-600">Register</Link> • <Link to="/" className="text-violet-600">Landing</Link></div>
      </div>
    </div>
  )
}
