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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await validatePin(code); navigate('/dashboard') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Card id="pin" className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Masuk Kelas</CardTitle>
        <CardDescription>Masukkan 6 digit kode dari gurumu untuk mulai belajar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="RIAU89" maxLength={6} required
            className="uppercase tracking-[0.3em] text-center font-mono"
          />
          <Button type="submit" disabled={loading}>{loading ? '...' : 'Mulai'}</Button>
        </form>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-3">{error}</div>}
      </CardContent>
    </Card>
  )
}

export default function Landing() {
  const isAuthenticated = !!getToken()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg"><span className="w-8 h-8 rounded bg-violet-600 text-white grid place-items-center">A</span> Asri ASR</div>
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
          <span className="inline-block text-xs px-2 py-1 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30">ASR E-Book Interaktif • Bahasa Inggris</span>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">Automatic Speech Recognition <span className="text-violet-600">untuk Belajar Bahasa Inggris</span></h1>
          <p className="text-slate-600 dark:text-slate-300">
            Automatic Speech Recognition (ASR) adalah teknologi yang mengenali, memproses, dan mengubah ujaran menjadi teks secara otomatis — mendukung pembelajaran mandiri di dalam dan luar kelas.
          </p>
          <div className="flex gap-3">
            <a href="#pin" className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium">Mulai Belajar →</a>
            <Link to="/teacher/login" className="px-5 py-2.5 border rounded-lg text-sm">Guru</Link>
          </div>
          <div className="text-xs text-slate-500 flex gap-4">
            <span>✓ Go + Gin + GORM</span><span>✓ React + Vite + Tailwind</span><span>✓ PIN + JWT</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-600 to-emerald-500 rounded-2xl p-6 text-white">
          <h3 className="font-semibold">How ASR Works</h3>
          <div className="mt-3 bg-white/10 rounded-lg p-3 text-sm">
            <div className="text-white/60 text-xs">Contoh Language Model</div>
            <div className="font-mono">"I eat …" → apple / rice / breakfast</div>
          </div>
          <ol className="mt-4 space-y-1 text-sm list-decimal list-inside">
            <li>Speech Input</li><li>Signal Processing</li><li>Feature Extraction</li><li>Pattern Matching</li><li>Text Output</li>
          </ol>
        </div>
      </section>

      {/* PIN entry */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <PinCard />
      </section>

      {/* What is ASR */}
      <section className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-sm font-semibold text-violet-600">Definisi</div>
          <p className="text-sm mt-2">ASR adalah sistem yang dirancang untuk mengidentifikasi kata-kata yang diucapkan oleh manusia dan mengubahnya menjadi representasi teks <span className="text-slate-500">(Daniel Jurafsky)</span>.</p>
        </div>
        <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-sm font-semibold text-violet-600">James H. Martin</div>
          <p className="text-sm mt-2">ASR adalah AI yang mampu memahami bahasa lisan manusia dan memberi umpan balik otomatis.</p>
        </div>
        <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="text-sm font-semibold text-violet-600">Language Model</div>
          <p className="text-sm mt-2">Model memprediksi urutan kata yang mungkin muncul berikutnya dalam kalimat.</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold">ASR meningkatkan keterampilan karena:</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2 text-sm">
            <div className="flex gap-2"><span className="text-violet-600">1.</span> Siswa dapat melatih pengucapan kata dan kalimat secara berulang hingga mencapai pelafalan yang benar</div>
            <div className="flex gap-2"><span className="text-violet-600">2.</span> Sistem dapat memberikan koreksi terhadap kesalahan pengucapan secara langsung</div>
            <div className="flex gap-2"><span className="text-violet-600">3.</span> Siswa dapat berlatih berbicara tanpa harus selalu didampingi oleh guru</div>
            <div className="flex gap-2"><span className="text-violet-600">4.</span> Integrasi ASR dalam e-book interaktif memungkinkan interaksi langsung dengan materi</div>
          </div>
          <div className="border rounded-xl p-4 bg-violet-50 dark:bg-violet-950/30 text-sm">
            <div className="font-semibold">Mendukung pembelajaran mandiri</div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Memfasilitasi belajar di dalam dan luar kelas (David Nunan). Menyesuaikan kemampuan & kecepatan masing-masing. Memberi umpan balik real-time saat membaca & berbicara (Godwin-Jones).</p>
          </div>
        </div>
      </section>

      {/* Components */}
      <section className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-4">
        <div className="border rounded-xl p-5">
          <h3 className="font-semibold">E-book berbasis ASR</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2"><b>Speaking Practice</b> — fitur utama. ASR terbukti meningkatkan akurasi pengucapan, efektif untuk in-class learning (Yoa Liu).</p>
          <ul className="text-xs mt-3 list-disc list-inside text-slate-500">
            <li>Systematic Review (2020–2023) — Ms Dina: efektif speaking skill, immediate feedback, autonomous learning</li>
            <li>Xian Xian WU: mengukur akurasi, membandingkan speech dengan teks → reading aloud</li>
            <li>caoji WU: adaptif aksen & noise, real-time processing</li>
          </ul>
        </div>
        <div className="border rounded-xl p-5 bg-slate-900 text-white">
          <h3 className="font-semibold">Alur Penggunaan E-book ASR</h3>
          <ol className="mt-3 space-y-1 text-sm list-decimal list-inside text-white/80">
            <li>Siswa membuka e-book digital</li>
            <li>Membaca / mendengarkan materi</li>
            <li>Melakukan latihan berbicara</li>
            <li>Sistem ASR merekam suara</li>
            <li>Menganalisis pengucapan</li>
            <li>Memberikan umpan balik otomatis</li>
            <li>Memberi score</li>
          </ol>
          <p className="text-xs mt-3 text-white/60">Interaktif • berbasis praktik • feedback langsung • mandiri</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 text-center">
        <div className="rounded-2xl bg-violet-600 text-white p-8">
          <h2 className="text-2xl font-bold">Siap berlatih Bahasa Inggris dengan ASR?</h2>
          <p className="text-white/80 text-sm mt-2">Minta kode kelas ke gurumu, lalu masukkan di atas.</p>
          <div className="mt-4 flex justify-center gap-3">
            <a href="#pin" className="px-5 py-2 bg-white text-violet-600 rounded-lg text-sm font-medium">Masukkan Kode</a>
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-slate-500">Asri ASR E-Book • React + Vite + Tailwind • Go/Gin Backend</footer>
    </div>
  )
}
