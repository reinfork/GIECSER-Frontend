import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { authFetch, getProfile } from '../auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Dashboard() {
  const profile = getProfile()
  const name = profile?.kind === 'teacher' ? profile.email : profile?.name
  const [chapters, setChapters] = useState([])
  const [counts, setCounts] = useState({})
  const [pending, setPending] = useState(true)

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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <span className="text-xs font-semibold tracking-widest text-violet-600">STUDENT DASHBOARD</span>
      <h1 className="text-2xl font-bold mt-1">Good to see you{name ? `, ${name}` : ''}.</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Pick a chapter, record your voice, and let <b className="text-violet-600">AI</b> score it.
      </p>

      {pending ? (
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-44" /><Skeleton className="h-44" /><Skeleton className="h-44" /><Skeleton className="h-44" />
        </div>
      ) : chapters.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No chapters yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {chapters.map((c, i) => (
            <Link key={c.id} to={`/chapters/${c.id}`}>
              <Card className="h-full overflow-hidden bg-[#EAE3CC] dark:bg-slate-900 border-black/5 dark:border-slate-800 shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.9)] dark:shadow-none hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold tracking-widest text-violet-600">0{i + 1}</div>
                  <div className="font-bold text-lg mt-1">{c.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</div>
                  <div className="flex items-center justify-between mt-6 text-sm">
                    <span className="text-muted-foreground">{counts[c.id] ?? '—'} courses</span>
                    <Button size="sm" className="rounded-full" asChild>
                      <span>Open <ArrowRight className="size-4" /></span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
