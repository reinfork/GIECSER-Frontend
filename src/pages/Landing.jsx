import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getToken } from '../auth'
import { validatePin } from '../auth'
import { ThemeToggle } from '../theme'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function PinCard() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await validatePin(code, name); navigate('/dashboard') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Card id="pin" className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Join Class</CardTitle>
        <CardDescription>Enter the 6-digit code from your teacher to start learning</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-2">
          <Input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name" maxLength={60} required minLength={2}
          />
          <div className="flex gap-2">
            <Input
              value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Code" maxLength={6} required minLength={6}
              className="uppercase tracking-[0.3em] text-center font-mono"
            />
            <Button type="submit" disabled={loading}>{loading ? '...' : 'Start'}</Button>
          </div>
        </form>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-3">{error}</div>}
      </CardContent>
    </Card>
  )
}

const STEPS = [
  ['Record', 'Say the dialogue or monologue clearly.'],
  ['Feedback', 'See your score, what to fix, and how.'],
  ['Reflect', 'Judge your own speaking: fluent, correct, clear.'],
  ['Repeat', 'Practice again until you hit the target.'],
]

const CHAPTERS = [
  'Permainan Tradisional Menggunakan Alat',
  'Obat Tradisional Melayu Riau',
  'Transportasi Maritim Tradisional Melayu Riau',
  'Pakaian Tradisional Melayu Riau',
]

export default function Landing() {
  const isAuthenticated = !!getToken()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg"><span className="w-8 h-8 rounded bg-violet-600 text-white grid place-items-center">G</span> GIECSER ASR</div>
          <nav className="flex gap-2 items-center">
            <ThemeToggle className="px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded" />
            {isAuthenticated ? (
              <Link to="/dashboard" className="px-3 py-1.5 rounded bg-violet-600 text-white text-sm">Dashboard</Link>
            ) : (
              <Link to="/teacher/login" className="px-3 py-1.5 text-sm hover:bg-slate-100 rounded">Teacher</Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-5">
          <span className="text-xs font-semibold tracking-widest text-violet-600">SPEAKING E-BOOK • GRADE VIII • RIAU MALAY COASTAL WISDOM</span>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">Practice speaking. <span className="text-violet-600">AI</span> listens to every word.</h1>
          <p className="text-slate-600 dark:text-slate-300">
            A Grade VIII English speaking e-book (CEFR A2). Speak about Riau Malay culture, get ASR feedback instantly, repeat until fluent.
          </p>
          <div className="flex gap-3">
            <a href="#pin" className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium">Enter code</a>
            <Link to="/teacher/login" className="px-5 py-2.5 border rounded-lg text-sm">Teacher</Link>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-violet-500 to-amber-200 p-2">
          <img src="/landing_page2.jpg" alt="Students practicing together around a laptop" className="rounded-xl w-full aspect-[4/3] object-cover" />
        </div>
      </section>

      {/* Loop band */}
      <section className="bg-neutral-800 bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(([t, d], i) => (
            <div key={t}>
              <div className="text-xs font-semibold tracking-widest text-amber-200">0{i + 1}</div>
              <div className="mt-1 font-bold text-white">{t}</div>
              <p className="mt-1 text-sm text-white/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PIN entry */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <PinCard />
      </section>

      {/* Chapters */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold">4 Chapters</h2>
        <ul className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
          {CHAPTERS.map((c, i) => (
            <li key={c} className="rounded-xl px-4 py-4 bg-[#EAE3CC] dark:bg-slate-900 border border-black/5 dark:border-slate-800 shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.9)] dark:shadow-none"><b className="text-violet-600">{i + 1}.</b> {c}</li>
          ))}
        </ul>
      </section>

      {/* Classroom */}
      <section className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8 items-center">
        <img src="/landing_page3.jpg" alt="Teacher leading a classroom session" className="rounded-2xl w-full aspect-[4/3] object-cover" loading="lazy" />
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Built for the classroom</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">One class code opens the whole book. Students practice alone or in class; teachers follow every score from the panel.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 text-center">
        <div className="rounded-2xl bg-violet-600 text-white p-8">
          <h2 className="text-2xl font-bold">Ask your teacher for the class code.</h2>
          <div className="mt-4 flex justify-center gap-3">
            <a href="#pin" className="px-5 py-2 bg-white text-violet-600 rounded-lg text-sm font-medium">Enter code</a>
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-slate-500">GIECSER ASR E-Book • Grade VIII</footer>
    </div>
  )
}
