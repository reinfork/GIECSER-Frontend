import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { authFetch } from '../auth'
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
        <div className="flex gap-2 items-center">
          <label className="text-sm text-muted-foreground">Kode kelas</label>
          <select value={code} onChange={(e) => setCode(e.target.value)}
            className="border rounded px-2 py-1 text-sm bg-card font-mono tracking-[0.2em]">
            {pins.map((p) => <option key={p.id} value={p.code}>{p.code}</option>)}
          </select>
        </div>
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
  )
}
