import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../auth'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess(false)
    try { await register({ name, email, password }); setSuccess(true); setTimeout(() => navigate('/login'), 800) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h1 className="text-xl font-bold">Create account</h1>
        <p className="text-sm text-slate-500 mb-4">Student account untuk latihan ASR</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div><label className="text-sm font-medium">Name</label><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Budi" className="mt-1 w-full border rounded px-3 py-2 text-sm dark:bg-slate-800" /></div>
          <div><label className="text-sm font-medium">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="budi@test.com" className="mt-1 w-full border rounded px-3 py-2 text-sm dark:bg-slate-800" /></div>
          <div><label className="text-sm font-medium">Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="min 6 chars" className="mt-1 w-full border rounded px-3 py-2 text-sm dark:bg-slate-800" /></div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
          {success && <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">Registered! Redirecting...</div>}
          <button type="submit" disabled={loading} className="w-full bg-violet-600 text-white rounded py-2 text-sm font-medium disabled:opacity-50">{loading ? 'Loading...' : 'Register'}</button>
        </form>
        <div className="text-sm text-center text-slate-500 mt-4">Have account? <Link to="/login" className="text-violet-600">Login</Link></div>
      </div>
    </div>
  )
}
