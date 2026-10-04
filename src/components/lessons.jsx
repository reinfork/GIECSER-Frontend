import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Plain statement card for goal/reference modules (no speaking task attached).
// YAGNI: no progress, no checklist — the seed stores goals as plain text.
export function GoalBlock({ content, transcript }) {
  return (
    <Card className="mt-4">
      <CardContent className="pt-6 text-sm leading-relaxed whitespace-pre-wrap">
        {content}
        {transcript && transcript !== content && (
          <p className="mt-3 font-medium">{transcript}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ponytail: naive "Name:" split — misfires on mid-sentence caps like "Hi Dave: ok"; proper script lines when seeds gain newlines.
export function DialogueScript({ text }) {
  const turns = []
  const re = /([A-Z][a-zA-Z.'-]*:)/g
  let pending = null
  const chunks = String(text || '').split(re)
  const head = chunks.shift() || ''
  if (head.trim()) turns.push({ speaker: null, line: head.trim() })
  for (let i = 0; i < chunks.length; i += 2) {
    pending = chunks[i].slice(0, -1)
    const line = (chunks[i + 1] || '').trim()
    if (line) turns.push({ speaker: pending, line })
  }
  if (!turns.length) return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
  const speakers = [...new Set(turns.filter((t) => t.speaker).map((t) => t.speaker))]
  return (
    <div className="mt-4 space-y-2">
      {turns.map((t, i) => {
        if (!t.speaker) return <p key={i} className="text-sm text-muted-foreground">{t.line}</p>
        const left = speakers.indexOf(t.speaker) % 2 === 0
        return (
          <div key={i} className={cn('flex', left ? 'justify-start' : 'justify-end')}>
            <div className={cn('max-w-[85%] rounded-xl px-3 py-2 text-sm', left ? 'bg-secondary' : 'bg-primary text-primary-foreground')}>
              <div className="text-xs font-bold opacity-70">{t.speaker}</div>
              <div className="leading-relaxed">{t.line}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ponytail: Drive preview iframe (both VIDEO seeds are uc?export=download links, not streamable mp4); native <video> only for direct file urls, upgrade when seeds carry real mp4s.
export function VideoBlock({ url }) {
  if (!url) return null
  const id = String(url).match(/[?&]id=([-\w]+)/)?.[1]
  if (id) {
    return (
      <div className="mt-4">
        <div className="aspect-video w-full overflow-hidden rounded-xl border">
          <iframe src={`https://drive.google.com/file/d/${id}/preview`} className="h-full w-full" allow="autoplay" title="Lesson video" />
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary">
          <ExternalLink className="size-4" /> Open in Drive
        </a>
      </div>
    )
  }
  return (
    <video controls preload="metadata" src={url} className="mt-4 w-full rounded-xl border" />
  )
}

function safeParse(s) {
  try { return s ? JSON.parse(s) : null } catch { return null }
}

// ponytail: prompt-only cards — student API strips answer keys (Task.Public) and no check endpoint exists; add POST /tasks/:id/check when grading is wanted.
export function QuizList({ tasks }) {
  if (!tasks?.length) return null
  return (
    <div className="mt-4 space-y-3">
      {tasks.filter((t) => t.type !== 'SPEAKING_RECORDING').map((t, i) => {
        const opt = safeParse(t.options_json)
        return (
          <Card key={t.id} className="py-4">
            <CardContent className="text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t.type}</Badge>
                <span className="text-muted-foreground">Q{i + 1}</span>
              </div>
              <p className="mt-2 leading-relaxed whitespace-pre-wrap">{t.prompt}</p>
              {opt && !opt.statements && !opt.bank && !opt.sentences && (
                <ul className="mt-2 space-y-1">
                  {Object.entries(opt).map(([k, v]) => (
                    <li key={k} className="rounded-lg bg-secondary px-3 py-1.5"><b>{k}.</b> {String(v)}</li>
                  ))}
                </ul>
              )}
              {opt?.statements && (
                <div className="mt-2 grid sm:grid-cols-2 gap-2">
                  <ul className="space-y-1">
                    {Object.entries(opt.statements).map(([k, v]) => <li key={k} className="rounded-lg bg-secondary px-3 py-1.5"><b>{k}.</b> {String(v)}</li>)}
                  </ul>
                  <ul className="space-y-1">
                    {Object.entries(opt.endings || {}).map(([k, v]) => <li key={k} className="rounded-lg border px-3 py-1.5"><b>{k}.</b> {String(v)}</li>)}
                  </ul>
                </div>
              )}
              {opt?.bank && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {opt.bank.map((w) => <Badge key={w} variant="secondary">{w}</Badge>)}
                </div>
              )}
              {opt?.sentences && (
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {opt.sentences.map((s) => <li key={s}>{s}</li>)}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Say your answer aloud.</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
