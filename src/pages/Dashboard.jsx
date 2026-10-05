import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { authFetch, getProfile } from '../auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const tileTints = [
  'from-violet-200/70 to-fuchsia-100/70 dark:from-violet-950 dark:to-fuchsia-950/40',
  'from-emerald-200/70 to-teal-100/70 dark:from-emerald-950 dark:to-teal-950/40',
  'from-amber-200/70 to-orange-100/70 dark:from-amber-950 dark:to-orange-950/40',
  'from-sky-200/70 to-indigo-100/70 dark:from-sky-950 dark:to-indigo-950/40',
]
const avatarTints = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
]

const initials = (title = '') =>
  title.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'A'

export default function Dashboard() {
  const profile = getProfile()
  const [chapters, setChapters] = useState([])
  const [counts, setCounts] = useState({})
  const [pending, setPending] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    authFetch('/chapters')
      .then(async (res) => {
        const list = res.data || []
        setChapters(list)
        const entries = await Promise.all(
          list.map(async (c) => {
            try {
              const r = await authFetch(`/chapters/${c.id}/courses`)
              return [c.id, (r.data || []).length]
            } catch { return [c.id, 0] }
          })
        )
        setCounts(Object.fromEntries(entries))
      })
      .catch(() => {})
      .finally(() => setPending(false))
  }, [])

  const featured = chapters.slice(0, 3)
  const rows = showAll ? chapters : chapters.slice(0, 6)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <p className="text-sm text-muted-foreground">
        Welcome{profile?.kind === 'teacher' ? `, ${profile.email}` : ''} — GIECSER ASR English Practice
      </p>
      <h1 className="text-2xl font-bold mt-1 mb-6">Chapters</h1>

      {pending ? (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Skeleton className="h-44" /><Skeleton className="h-44" /><Skeleton className="h-44" />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {featured.map((c, i) => (
            <Link key={c.id} to={`/chapters/${c.id}`}>
              <Card className={cn('overflow-hidden bg-gradient-to-br py-0 gap-0 hover:shadow-md transition-shadow', tileTints[i % tileTints.length])}>
                <CardContent className="p-5">
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{c.description}</div>
                  <div className="flex items-center justify-between mt-8 text-sm">
                    <span className="text-muted-foreground">{counts[c.id] ?? '—'} courses</span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h2 className="text-xl font-bold mb-3">Recent Activity</h2>
      <Card className="py-0 overflow-hidden">
        <CardContent className="p-0">
          {pending ? (
            <div className="p-4 space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : chapters.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No chapters yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chapter title</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="flex items-center gap-3 font-medium">
                        <Avatar className={cn('size-9 rounded-lg', avatarTints[i % avatarTints.length])}>
                          <AvatarFallback className={cn('rounded-lg font-semibold', avatarTints[i % avatarTints.length])}>{initials(c.title)}</AvatarFallback>
                        </Avatar>
                        {c.title}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{counts[c.id] ?? '—'} courses</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/chapters/${c.id}`}>Open <ArrowRight className="size-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {chapters.length > 6 && (
        <div className="text-center mt-3">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'show less' : 'see more'} <ChevronDown className={cn('size-4 transition-transform', showAll && 'rotate-180')} />
          </Button>
        </div>
      )}
    </div>
  )
}
