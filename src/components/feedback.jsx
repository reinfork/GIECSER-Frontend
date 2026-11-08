import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '')
    return v ?? fallback
  } catch { return fallback }
}

// SectionGate shows the student's recorded scores for one section: speaking
// tasks in same-course modules before the gate (whole chapter when empty).
// Pass needs every scope task attempted with average word accuracy >= 80.
export function SectionGate({ chapterId, gateModuleId }) {
  const [gate, setGate] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    authFetch(`/my/scores?chapter_id=${chapterId}&before_module_id=${gateModuleId}`)
      .then((g) => { if (live) setGate(g) })
      .catch((e) => { if (live) setError(e.message) })
    return () => { live = false }
  }, [chapterId, gateModuleId])
  const byTask = Object.fromEntries((gate?.rows || []).map((r) => [r.task_id, r]))
  const weak = [...(gate?.scope || [])].sort(
    (a, b) => (byTask[a.task_id]?.word_accuracy_score ?? -1) - (byTask[b.task_id]?.word_accuracy_score ?? -1)
  )
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Section score</CardTitle>
        <CardDescription>
          {!gate && !error ? 'Loading recorded scores…'
            : gate.scope.length === 0 ? 'No scored speaking tasks in this section yet.'
            : `${gate.attempted} of ${gate.scope.length} tasks recorded · average ${Math.round(gate.average)}%`}
        </CardDescription>
      </CardHeader>
      {(gate?.scope.length > 0 || error) && (
        <CardContent className="space-y-2 text-sm">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {gate && (gate.pass
            ? <p className="text-sm text-green-700">Average 80%+ reached — continue to the next steps.</p>
            : <p className="text-sm text-amber-700">Below 80% average — re-practice the weakest tasks, then continue.</p>)}
          {weak.map((t) => {
            const s = byTask[t.task_id]
            return (
              <div key={t.task_id} className="flex items-center justify-between gap-3">
                <span className="truncate">{t.module_title}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary">{s ? `${Math.round(s.word_accuracy_score)}%` : '—'}</Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/modules/${t.module_id}`}>Practice</Link>
                  </Button>
                </span>
              </div>
            )
          })}
        </CardContent>
      )}
    </Card>
  )
}

// ponytail: attempts + verdict live in localStorage (no student key server-side
// by design); logout wipes them — see auth.jsx.
export function ChapterFeedbackPanel({ chapterId }) {
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
