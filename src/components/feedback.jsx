import { useEffect, useState } from 'react'
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

// SectionGate shows the student's recorded average for one section: speaking
// tasks in same-course modules before the gate (whole chapter when empty).
// Pass needs every scope task attempted with average word accuracy >= 80.
// The verdict reuses the chapter-feedback AI call over the gate's attempts.
export function SectionGate({ chapterId, gateModuleId }) {
  const [gate, setGate] = useState(null)
  const [error, setError] = useState('')
  const [verdict, setVerdict] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let live = true
    authFetch(`/my/scores?chapter_id=${chapterId}&before_module_id=${gateModuleId}`)
      .then((g) => { if (live) setGate(g) })
      .catch((e) => { if (live) setError(e.message) })
    return () => { live = false }
  }, [chapterId, gateModuleId])
  async function generate() {
    if (!gate) return
    setBusy(true); setError('')
    try {
      const byTask = Object.fromEntries((gate.rows || []).map((r) => [r.task_id, r]))
      const attempts = gate.scope.filter((t) => byTask[t.task_id]).map((t) => {
        const r = byTask[t.task_id]
        return {
          task_id: t.task_id, reference: t.reference || '', transcribed: r.transcribed_text || '',
          word_accuracy: r.word_accuracy_score || 0, fluency: r.fluency_score || 0,
          pronunciation: r.pronunciation_score || 0, wpm: r.wpm || 0, phonetic_words: [],
        }
      })
      setVerdict(await authFetch(`/chapters/${chapterId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ attempts }),
      }))
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const n = gate?.scope.length || 0
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Section score</CardTitle>
        <CardDescription>
          {!gate && !error ? 'Loading recorded scores…'
            : n === 0 ? 'No scored speaking tasks in this section yet.'
            : `${gate.attempted} of ${n} tasks recorded · average ${Math.round(gate.average)}%`}
        </CardDescription>
      </CardHeader>
      {(n > 0 || error) && (
        <CardContent className="space-y-3 text-sm">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {gate && n > 0 && (gate.pass
            ? <p className="text-sm text-green-700">Average 80%+ reached — continue to the next steps.</p>
            : <p className="text-sm text-amber-700">Below 80% average — re-practice this section, then generate feedback again.</p>)}
          {gate && n > 0 && (
            <Button onClick={generate} disabled={busy || gate.attempted === 0} className="rounded-full">
              {busy ? 'Generating...' : verdict ? 'Regenerate section feedback' : 'Generate section feedback'}
            </Button>
          )}
          {verdict && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center gap-2">
                <Badge>{verdict.overall_band}</Badge>
                <span className="text-muted-foreground">
                  {Math.round(verdict.avg_accuracy)}% accuracy · {Math.round(verdict.avg_fluency)} fluency
                </span>
              </div>
              {verdict.next_steps?.length > 0 && (
                <ul className="list-disc list-inside text-muted-foreground">
                  {verdict.next_steps.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              )}
            </div>
          )}
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
