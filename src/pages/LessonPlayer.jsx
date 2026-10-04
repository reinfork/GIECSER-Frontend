import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Mic, Square } from 'lucide-react'
import { authFetch } from '../auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogueScript, GoalBlock, QuizList, VideoBlock } from '@/components/lessons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function LessonPlayer() {
  const { id } = useParams()

  const [module, setModule] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [tasks, setTasks] = useState([])
  const [pending, setPending] = useState(true)

  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const [recording, setRecording] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setPending(true)
    setResult(null); setError('')
    authFetch(`/modules/${id}`)
      .then(async (m) => {
        setModule(m)
        const [list, tasks] = await Promise.all([
          authFetch(`/courses/${m.course_id}/modules`).catch(() => ({ data: [] })),
          authFetch(`/modules/${m.id}/tasks`).catch(() => ({ data: [] })),
        ])
        setSiblings(list.data || [])
        setTasks(tasks.data || [])
      })
      .catch(() => {})
      .finally(() => setPending(false))
  }, [id])

  async function toggleRecording() {
    if (recording) {
      mediaRecorder.current?.stop()
      return
    }
    setError(''); setResult(null)
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Microphone unavailable — allow access and retry.')
      return
    }
    chunks.current = []
    const rec = new MediaRecorder(stream)
    mediaRecorder.current = rec
    rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data) }
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      setRecording(false)
      await submit(new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' }))
    }
    rec.start()
    setRecording(true)
  }

  async function submit(blob) {
    const speakTask = tasks.find((t) => t.type === 'SPEAKING_RECORDING')
    if (!speakTask) { setError('No speaking task on this module yet.'); return }
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('audio', blob, 'practice.webm')
      const token = localStorage.getItem('token')
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/tasks/${speakTask.id}/submit-audio`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const text = await res.text()
      let json
      try { json = text ? JSON.parse(text) : {} } catch { throw new Error(text.slice(0, 120) || `HTTP ${res.status}`) }
      if (!res.ok) throw new Error(json.error || 'Assessment failed, try again')
      setResult(json)
    } catch (e) { setError(e.message) } finally { setSubmitting(false) }
  }

  const idx = siblings.findIndex((m) => m.id === id)
  const prev = idx > 0 ? siblings[idx - 1] : null
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null
  const speakTask = tasks.find((t) => t.type === 'SPEAKING_RECORDING')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-primary">
        <ArrowLeft className="size-4" /> Back to chapters
      </Link>

      {pending ? (
        <div className="mt-3 space-y-2"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-64 w-full" /></div>
      ) : !module ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Module not found.</div>
      ) : (
        <div className="mt-3 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">{module.type}</Badge>
              <Badge variant="outline">EN</Badge>
              <span className="text-muted-foreground">Module {module.order_index}{idx >= 0 && ` of ${siblings.length}`}</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">{module.title}</h1>

            {module.type === 'VIDEO' ? (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{module.content_text}</p>
                  <VideoBlock url={module.media_url} />
                </CardContent>
              </Card>
            ) : module.type === 'DIALOGUE' ? (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">{module.content_text}</p>
                  <DialogueScript text={module.target_transcript} />
                  {speakTask && (
                    <div className="text-center">
                      <Button size="lg" onClick={toggleRecording} disabled={submitting} className="mt-6 rounded-full">
                        {recording ? <><Square className="size-4" /> Stop & assess</> : <><Mic className="size-4" /> {submitting ? 'Scoring...' : 'Record speaking'}</>}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : !speakTask && module.type !== 'QUIZ' ? (
              <GoalBlock content={module.content_text} transcript={module.target_transcript} />
            ) : module.type !== 'QUIZ' ? (
              <Card className="mt-4">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground text-sm">Read aloud, then record:</p>
                  <p className="text-lg leading-relaxed whitespace-pre-wrap mt-2">{module.target_transcript || module.content_text}</p>
                  <Button size="lg" onClick={toggleRecording} disabled={submitting || !speakTask} className="mt-6 rounded-full">
                    {recording ? <><Square className="size-4" /> Stop & assess</> : <><Mic className="size-4" /> {submitting ? 'Scoring...' : 'Record speaking'}</>}
                  </Button>
                  {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                </CardContent>
              </Card>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{module.content_text}</p>
            )}

            {module.audio_model_url && (
              <audio controls preload="none" src={module.audio_model_url} className="mt-4 w-full" />
            )}

            <QuizList tasks={tasks} />

            {module.type === 'DIALOGUE' && error && <p className="text-sm text-red-600 mt-3 text-center">{error}</p>}

            {result && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Score: {Math.round(result.pronunciation_score)}%</CardTitle>
                  <CardDescription>&ldquo;{result.transcribed_text}&rdquo;</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border rounded-lg p-2"><div className="font-bold">{Math.round(result.word_accuracy_score)}%</div><div className="text-xs text-muted-foreground">Accuracy</div></div>
                    <div className="border rounded-lg p-2"><div className="font-bold">{Math.round(result.fluency_score)}%</div><div className="text-xs text-muted-foreground">Fluency</div></div>
                    <div className="border rounded-lg p-2"><div className="font-bold">{Math.round(result.pronunciation_score)}%</div><div className="text-xs text-muted-foreground">Overall</div></div>
                  </div>
                  {result.feedback?.phonetic_feedback?.length > 0 && (
                    <div>
                      <div className="font-semibold mb-1">Pronunciation notes</div>
                      <ul className="space-y-1 text-muted-foreground">
                        {result.feedback.phonetic_feedback.map((p, i) => (
                          <li key={i}><b className="text-foreground">{p.word}</b> — said {p.actual}, target {p.target}. {p.tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.feedback?.grammar_corrections?.length > 0 && (
                    <div>
                      <div className="font-semibold mb-1">Grammar</div>
                      <ul className="space-y-1 text-muted-foreground">
                        {result.feedback.grammar_corrections.map((g, i) => (
                          <li key={i}>&ldquo;{g.original}&rdquo; → &ldquo;{g.corrected}&rdquo;. {g.explanation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.feedback?.cultural_context_notes && (
                    <div>
                      <div className="font-semibold mb-1">Cultural note</div>
                      <p className="text-muted-foreground">{result.feedback.cultural_context_notes}</p>
                    </div>
                  )}
                  {result.feedback?.actionable_tips?.length > 0 && (
                    <div>
                      <div className="font-semibold mb-1">Next try</div>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {result.feedback.actionable_tips.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between mt-4">
              {prev ? (
                <Button variant="outline" asChild>
                  <Link to={`/modules/${prev.id}`}><ArrowLeft className="size-4" /> {prev.title}</Link>
                </Button>
              ) : <span />}
              {next && (
                <Button asChild>
                  <Link to={`/modules/${next.id}`}>{next.title} <ArrowRight className="size-4" /></Link>
                </Button>
              )}
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Read the target sentence aloud, then record it for AI assessment.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Position</div>
                  <div className="font-medium">Module {module.order_index}{idx >= 0 && ` of ${siblings.length}`}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Language</div>
                  <div className="font-medium">EN</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Words to read</div>
                  <div className="font-medium">{(module.target_transcript || '').trim().split(/\s+/).filter(Boolean).length} words</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="py-0 overflow-hidden lg:sticky lg:top-6">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <span className="font-semibold text-sm">Course Content</span>
              <Badge variant="secondary">{siblings.length} modules</Badge>
            </div>
            <Separator />
            <div className="max-h-[480px] overflow-y-auto py-1">
              {siblings.map((m) => {
                const active = m.id === id
                return (
                  <Link
                    key={m.id}
                    to={`/modules/${m.id}`}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                      active ? 'bg-accent font-medium border-l-2 border-l-primary' : 'hover:bg-accent/50 text-muted-foreground'
                    )}
                  >
                    <span className={cn('w-6 h-6 rounded-md grid place-items-center text-xs font-bold shrink-0', active ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                      {m.order_index}
                    </span>
                    <span className="truncate">{m.title}</span>
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
