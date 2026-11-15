import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Copy, KeyRound, LogOut, Plus } from 'lucide-react'
import { authFetch, getProfile, logout } from '../auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// ponytail: plain links, not nested routes — the two panels stay separate
// pages; tabs are only the switch. A single tabbed page replaces this when
// the panels need shared state.
export function TeacherTabs({ active }) {
  const tabs = [
    { key: 'kode', label: 'Kode Kelas', to: '/teacher' },
    { key: 'nilai', label: 'Nilai', to: '/teacher/scores' },
  ]
  return (
    <div className="flex gap-1 rounded-xl bg-secondary p-1">
      {tabs.map((t) => (
        <Link key={t.key} to={t.to} className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium text-center transition-colors', active === t.key ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}>
          {t.label}
        </Link>
      ))}
    </div>
  )
}

export default function Teacher() {
  const navigate = useNavigate()
  const profile = getProfile()
  const [pins, setPins] = useState([])
  const [pinsPending, setPinsPending] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')

  async function loadPins() {
    setPinsPending(true)
    try {
      const res = await authFetch('/access-codes')
      setPins(res.data || [])
    } catch (e) { setError(e.message) } finally { setPinsPending(false) }
  }

  useEffect(() => { loadPins() }, [])

  async function issue() {
    setIssuing(true); setError('')
    try {
      const pin = await authFetch('/access-codes', { method: 'POST', body: '{}' })
      setPins([pin, ...pins])
    } catch (e) { setError(e.message) } finally { setIssuing(false) }
  }

  // ponytail: fire-and-forget clipboard — the code stays visible to copy by
  // hand when the API is missing (non-secure contexts).
  async function copy(code) {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 1500) }
    catch { /* clipboard unavailable — code stays selectable */ }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">G</span>
            Teacher Panel <span className="text-xs font-normal text-muted-foreground">{profile?.email}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/') }}>
              <LogOut className="size-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <TeacherTabs active="kode" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="size-5" /> Kode Kelas</CardTitle>
            <p className="text-sm text-muted-foreground">Satu kode membuka seluruh buku untuk kelas.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button size="sm" onClick={issue} disabled={issuing}>
                <Plus className="size-4" /> {issuing ? '...' : 'Buat Kode (24 jam)'}
              </Button>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
            {pinsPending ? (
              <Skeleton className="h-24 w-full" />
            ) : pins.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Kode</TableHead><TableHead>Berlaku hingga</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pins.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-base tracking-[0.2em]">{p.code}</Badge>
                          <button onClick={() => copy(p.code)} aria-label={`Salin kode ${p.code}`} title="Salin kode"
                            className="rounded-md bg-secondary p-1.5 hover:bg-secondary/70 text-muted-foreground hover:text-foreground">
                            {copied === p.code ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                          </button>
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(p.expires_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada kode aktif. Buat satu untuk memulai kelas.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
