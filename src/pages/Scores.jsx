import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { authFetch } from '../auth'
import { TeacherTabs } from './Teacher'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const pct = (v) => `${Math.round(v)}%`

export default function Scores() {
  const [pins, setPins] = useState([])
  const [code, setCode] = useState('')
  const [rows, setRows] = useState([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    authFetch('/access-codes').then((r) => {
      const list = r.data || []
      setPins(list)
      if (list[0]) setCode(list[0].code)
    }).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!code) return
    setPending(true); setError('')
    authFetch(`/scores?code=${code}`).then((r) => setRows(r.data || []))
      .catch((e) => setError(e.message)).finally(() => setPending(false))
  }, [code])

  // ponytail: client-side chapter grouping over one flat rollup response —
  // server grouping when classes outgrow a few dozen students.
  const byChapter = rows.reduce((acc, r) => {
    (acc[r.chapter_title] = acc[r.chapter_title] || []).push(r)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">G</span>
            Nilai Siswa
          </div>
          <Link to="/teacher" className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Panel Guru
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <TeacherTabs active="nilai" />
        <div className="grid md:grid-cols-[210px_1fr] gap-4 items-start">
          <Card>
            <CardContent className="pt-4 space-y-1.5">
              <div className="text-sm font-semibold px-1">Kode kelas</div>
              {pins.length === 0 && !pending && <p className="text-xs text-muted-foreground px-1">Belum ada kode.</p>}
              {pins.map((p) => (
                <button key={p.id} onClick={() => setCode(p.code)}
                  className={cn('block w-full rounded-lg px-3 py-2 text-sm font-mono tracking-[0.2em] text-left transition-colors', code === p.code ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/70')}>
                  {p.code}
                </button>
              ))}
            </CardContent>
          </Card>
          <div className="space-y-4 min-w-0">
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        {pending && <p className="text-sm text-muted-foreground">Memuat…</p>}
        {!pending && rows.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">Belum ada nilai untuk kode ini.</p>
        )}
        {Object.entries(byChapter).map(([ch, list]) => (
          <Card key={ch}>
            <CardHeader><CardTitle className="text-base">{ch}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Siswa</TableHead><TableHead>Modul</TableHead><TableHead>Akurasi</TableHead><TableHead>Kelancaran</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((r) => (
                    <TableRow key={`${r.student_name}-${r.task_id}`}>
                      <TableCell className="font-medium">{r.student_name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.module_title}</TableCell>
                      <TableCell>{pct(r.word_accuracy_score)}</TableCell>
                      <TableCell>{pct(r.fluency_score)}</TableCell>
                      <TableCell>
                        <Badge variant={r.word_accuracy_score >= 80 ? 'default' : 'secondary'}
                          className={cn(r.word_accuracy_score >= 80 && 'bg-emerald-600')}>
                          {r.word_accuracy_score >= 80 ? 'Lulus 80%' : 'Belum 80%'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
          </div>
        </div>
      </div>
    </div>
  )
}
