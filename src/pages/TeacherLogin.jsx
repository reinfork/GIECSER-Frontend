import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { teacherLogin } from '../auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function TeacherLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await teacherLogin(email, password); navigate('/teacher') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-white dark:bg-slate-950">
      <div className="hidden md:block relative bg-[#EAE3CC] dark:bg-slate-900">
        <img src="/landing_page.jpg" alt="Teacher reading with students in a library" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 p-8 text-white">
          <div className="flex items-center gap-2 font-bold text-lg"><span className="w-8 h-8 rounded bg-violet-600 text-white grid place-items-center">G</span> GIECSER ASR</div>
          <p className="mt-2 text-sm text-white/80">Buat kode kelas, pantau nilai speaking siswa.</p>
        </div>
      </div>
      <div className="grid place-items-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Teacher Login</CardTitle>
            <CardDescription>Masuk untuk membuat kode kelas</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="guru@sekolah.id" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="••••••••" className="mt-1" />
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Loading...' : 'Login'}</Button>
            </form>
            <div className="text-sm text-center text-muted-foreground mt-4">
              Siswa? <Link to="/" className="text-primary">Masuk dengan kode kelas</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
