import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { authFetch } from '../auth'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '')
    return v ?? fallback
  } catch { return fallback }
}

// ponytail: attempts + verdict live in localStorage (no student key server-side
// by design); logout wipes them — see auth.jsx.
function ChapterFeedbackPanel({ chapterId }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const attempts = Object.values(readJSON(`asri_chapter_${chapterId}`, {}))
  const [saved, setSaved] = useState(() => readJSON(`asri_verdict_${chapterId}`, null))
  const stale = saved && saved.covers !== attempts.length

  async function generate() {
    setBusy(true); setError('')
    try {
      const verdict = await authFetch(`/chapters/${chapterId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ attempts }),
      })
      const record = { verdict, covers: attempts.length, generated_at: new Date().toISOString() }
      localStorage.setItem(`asri_verdict_${chapterId}`, JSON.stringify(record))
      setSaved(record)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const v = saved?.verdict
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Chapter feedback</CardTitle>
        <CardDescription>
          {attempts.length === 0
            ? 'Record speaking practice in this chapter, then generate one verdict.'
            : `${attempts.length} practice recording${attempts.length > 1 ? 's' : ''} on this device.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Button onClick={generate} disabled={busy || attempts.length === 0} className="rounded-full">
          {busy ? 'Generating...' : saved ? 'Regenerate feedback' : 'Generate chapter feedback'}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {stale && <p className="text-sm text-amber-600">New recordings since this verdict — regenerate for an up-to-date verdict.</p>}
        {v && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-2">
              <Badge>{v.overall_band}</Badge>
              <span className="text-muted-foreground">
                {Math.round(v.avg_accuracy)}% accuracy · {Math.round(v.avg_fluency)} fluency
              </span>
            </div>
            {v.recurring_words?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {v.recurring_words.map((w) => <Badge key={w} variant="secondary">{w}</Badge>)}
              </div>
            )}
            {v.next_steps?.length > 0 && (
              <ul className="list-disc list-inside text-muted-foreground">
                {v.next_steps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function CourseDetail() {
  const { id } = useParams()

  const [chapter, setChapter] = useState(null)
  const [courses, setCourses] = useState([])
  const [pending, setPending] = useState(true)

  useEffect(() => {
    setPending(true)
    Promise.all([
      authFetch(`/chapters/${id}`).catch(() => null),
      authFetch(`/chapters/${id}/courses`).catch(() => ({ data: [] })),
    ])
      .then(([ch, list]) => { setChapter(ch); setCourses(list.data || []) })
      .finally(() => setPending(false))
  }, [id])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/dashboard" className="text-sm text-primary">← Back to chapters</Link>

      {pending ? (
        <div className="mt-3 space-y-2"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></div>
      ) : !chapter ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Chapter not found.</div>
      ) : (
        <div className="mt-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="secondary">{courses.length} courses</Badge>
                  <h1 className="text-2xl font-bold mt-2">{chapter.title}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{chapter.description}</p>
                </div>
                {courses.length > 0 && (
                  <Button asChild className="shrink-0 rounded-full">
                    <Link to={`/courses/${courses[0].id}`}>Continue Learning</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <ChapterFeedbackPanel chapterId={id} />

          <div className="mt-6">
            {courses.length === 0 ? (
              <div className="py-6 text-sm text-muted-foreground text-center">No courses yet.</div>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {courses.map((c) => (
                  <AccordionItem key={c.id} value={c.id} className="border rounded-xl px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <span className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-secondary grid place-items-center text-sm font-bold">{c.order_index}</span>
                        <span className="font-medium">{c.title}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                      <div className="mt-3">
                        <Button size="sm" asChild>
                          <Link to={`/courses/${c.id}`}>Open course <ArrowRight className="size-4" /></Link>
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
