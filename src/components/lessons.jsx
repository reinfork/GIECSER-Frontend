import { useRef, useState } from 'react'
import { Check, ExternalLink, Mic, Volume2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

// One passage treatment for all reading prose: justified, plain weight,
// relaxed leading. Dialogue bubbles stay left-aligned (chat convention).
export const passageCls = 'text-justify font-normal leading-relaxed'

// Plain statement card for goal/reference modules (no speaking task attached).
// YAGNI: no progress, no checklist — the seed stores goals as plain text.
export function GoalBlock({ content, transcript }) {
  const say = transcript && transcript !== content ? `${content}. ${transcript}` : (transcript || content)
  return (
    <Card className="mt-4">
      <CardContent className={`pt-6 text-sm whitespace-pre-wrap ${passageCls}`}>
        <div className="mb-3"><ListenButton text={say} /></div>
        {content}
        {transcript && transcript !== content && (
          <p className="mt-3">{transcript}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ponytail: naive "Name:" split — misfires on mid-sentence caps like "Hi Dave: ok"; proper script lines when seeds gain newlines.
function parseTurns(text) {
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
  return turns
}
export function DialogueScript({ text }) {
  const turns = parseTurns(text)
  if (!turns.length) return <p className={`text-sm whitespace-pre-wrap ${passageCls}`}>{text}</p>
  const speakers = [...new Set(turns.filter((t) => t.speaker).map((t) => t.speaker))]
  return (
    <div className="mt-4 space-y-2">
      {turns.map((t, i) => {
        if (!t.speaker) {
          return (
            <p key={i} className="text-sm text-muted-foreground">
              {t.line} <CellListen text={t.line} label="Hear narration" />
            </p>
          )
        }
        const left = speakers.indexOf(t.speaker) % 2 === 0
        return (
          <div key={i} className={cn('flex', left ? 'justify-start' : 'justify-end')}>
            <div className={cn('max-w-[85%] rounded-xl px-3 py-2 text-sm', left ? 'bg-secondary' : 'bg-primary text-primary-foreground')}>
              <div className="flex items-center gap-1.5 text-xs font-bold opacity-70">
                {t.speaker}
                <button onClick={() => speakText(t.line)} aria-label={`Hear ${t.speaker}'s line`} className="hover:opacity-100">
                  <Volume2 className="size-3.5" />
                </button>
              </div>
              <div className="leading-relaxed">{t.line}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ponytail: Drive ?id= preview + YouTube embeds; native <video> only for direct file urls.
export function VideoBlock({ url }) {
  if (!url) return null
  const id = String(url).match(/[?&]id=([-\w]+)/)?.[1]
  const yt = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)?.[1]
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
  if (yt) {
    return (
      <div className="mt-4">
        <div className="aspect-video w-full overflow-hidden rounded-xl border">
          <iframe src={`https://www.youtube.com/embed/${yt}`} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Lesson video" />
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary">
          <ExternalLink className="size-4" /> Watch on YouTube
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

// Ordering tasks render inside StoryOrder, not as quiz cards.
function hasSentences(t) {
  return !!safeParse(t.options_json)?.sentences
}

// ponytail: hardcoded AvaMultilingual voice (supervisor pick) with en-voice
// fallback — school machines without it still speak; a voice picker replaces
// this when one hardcoded voice proves wrong across the lab.
function speakText(line) {
  try {
    const u = new window.SpeechSynthesisUtterance(line)
    const voices = window.speechSynthesis.getVoices()
    u.voice = voices.find((v) => /ava.*multilingual/i.test(v.name))
      || voices.find((v) => v.lang?.startsWith('en')) || null
    u.lang = 'en-US'
    u.rate = 0.9
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* TTS unsupported — text stays readable */ }
}

// ponytail: fire-and-forget TTS, no pause/resume — add when passages outgrow one breath.
// One uniform control family: solid primary + shadow + lift so every
// listen/speak affordance reads as a button. Fixed icon sizing ends the
// giant-icon class for good.
const pressable = 'transition hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-md'

export function ListenButton({ text }) {
  if (!String(text || '').trim()) return null
  return (
    <button onClick={() => speakText(text)} title="Listen" className={`inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md ${pressable}`}>
      <Volume2 className="size-4" /> Listen
    </button>
  )
}

export function CellListen({ text, label }) {
  if (!String(text || '').trim()) return null
  return (
    <button onClick={() => speakText(text)} title={label || 'Listen'} aria-label={label || 'Listen'} className={`mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary align-middle text-primary-foreground shadow-md ${pressable}`}>
      <Volume2 className="size-4" />
    </button>
  )
}

export function MicButton({ onClick, on, label }) {
  return (
    <button onClick={onClick} title={label || 'Speak'} aria-label={label || 'Speak'} className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-md', pressable, on ? 'animate-pulse bg-red-500' : 'bg-primary')}>
      <Mic className="size-4" />
    </button>
  )
}

// Word/expression table. pairs: [["Heal","The crushed leaves…"]], words: ["Root",…].
export function VocabTable({ pairs, words }) {
  const rows = pairs?.length ? pairs : (words || []).map((w) => [w])
  if (!rows.length) return null
  const showExample = pairs?.length > 0
  return (
    <Card className="mt-4 py-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Word</TableHead>
            <TableHead className="w-10" />
            {showExample && <TableHead>Example</TableHead>}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([w, ex], i) => <VocabRow key={i} word={w} example={showExample ? ex : null} />)}
        </TableBody>
      </Table>
    </Card>
  )
}

// ponytail: one hook for all mic rows (vocab, questions) — the module mic
// keeps its own flow (upload fallback + chapter aggregate). Chrome/Edge-only:
// mic hides elsewhere, TTS speaker stays.
function useSpeechRecognition(onFinal) {
  const [live, setLive] = useState('')
  const [on, setOn] = useState(false)
  const startedAt = useRef(0)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  function listen() {
    if (!SR || on) return
    const r = new SR()
    r.lang = 'en-US'
    r.interimResults = true
    r.maxAlternatives = 1
    startedAt.current = Date.now()
    setOn(true); setLive('')
    r.onresult = (e) => {
      let interim = '', fin = ''
      for (const res of e.results) {
        if (res.isFinal) fin += res[0].transcript
        else interim += res[0].transcript
      }
      if (interim) setLive(interim)
      if (fin) { setLive(''); setOn(false); onFinal(fin, (Date.now() - startedAt.current) / 1000) }
    }
    r.onend = () => { setOn(false); setLive('') }
    r.onerror = () => { setOn(false); setLive('') }
    try { r.start() } catch { setOn(false) }
  }
  return { SR, live, on, listen }
}

// ponytail: transcription-only by supervisor call, no scoring path.
export function VocabRow({ word, example }) {
  const [heard, setHeard] = useState('')
  const { SR, live, on, listen } = useSpeechRecognition((fin) => setHeard(fin))
  // ponytail: local string-match verdict — real phoneme scoring stays in the
  // Groq module pipeline; per-word backend check replaces this when it exists.
  const norm = (s) => s.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const hw = norm(heard).split(' ')
  const ok = heard && (norm(word).includes(' ')
    ? norm(heard).includes(norm(word)) || norm(word).includes(norm(heard))
    : hw.includes(norm(word)))
  return (
    <TableRow>
      <TableCell className="font-medium whitespace-normal">
        {word}
        {on && live && <div className="font-normal text-xs text-muted-foreground mt-0.5 animate-pulse">&ldquo;{live}&rdquo;</div>}
        {heard && (
          <div className={cn('font-normal text-xs mt-0.5', ok ? 'text-green-600' : 'text-amber-600')}>
            {ok ? <><Check className="size-3.5 inline" /> Correct — </> : 'Try again — '}&ldquo;{heard}&rdquo;
          </div>
        )}
      </TableCell>
      <TableCell>
        {SR && <MicButton onClick={listen} on={on} label={`Say ${word}`} />}
      </TableCell>
      {example != null && <TableCell className="text-muted-foreground whitespace-normal">{example}</TableCell>}
      <TableCell className="text-right">
        <CellListen text={word} label={`Hear ${word}`} />
      </TableCell>
    </TableRow>
  )
}

// ponytail: formative per-role practice — transcription verdicts only, no
// scoring path or chapter aggregate; a scored per-role check replaces this
// when the brief asks for it.
export function RolePlay({ text }) {
  const turns = parseTurns(text)
  const speakers = [...new Set(turns.filter((t) => t.speaker).map((t) => t.speaker))]
  const [role, setRole] = useState(speakers[0] || null)
  if (!speakers.length) return null
  const active = role || speakers[0]
  const lines = turns.filter((t) => t.speaker === active)
  return (
    <Card className="mt-4 py-0 overflow-hidden">
      <div className="px-4 pt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Practice one role</span>
        {speakers.map((s) => (
          <Button key={s} size="sm" variant={active === s ? 'default' : 'secondary'} onClick={() => setRole(s)} className="rounded-full">
            {s}
          </Button>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Line</TableHead>
            <TableHead className="w-10" />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((t, i) => <VocabRow key={i} word={t.line} example={null} />)}
        </TableBody>
      </Table>
    </Card>
  )
}

// ponytail: fluency-only rows — results stay formative (no chapter
// aggregate). A visible Model answer shows outright; accuracy lights up
// when keys seed.
export function QuestionPractice({ tasks, onAnswer }) {
  const qs = (tasks || []).filter((t) => t.type === 'SPEAKING_RECORDING' && (/\?\s*$/.test(t.prompt || '') || hasModel(t)))
  if (!qs.length) return null
  return (
    <div className="mt-4 space-y-3">
      {qs.map((t) => <QuestionRow key={t.id} task={t} onAnswer={onAnswer} />)}
    </div>
  )
}

function hasModel(t) {
  try { return !!JSON.parse(t.options_json || '{}')['Model answer'] } catch { return false }
}

function QuestionRow({ task, onAnswer }) {
  const [heard, setHeard] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  let model = null
  try { model = JSON.parse(task.options_json || '{}')['Model answer'] || null } catch { /* unshaped */ }
  const { SR, live, on, listen } = useSpeechRecognition(async (fin, secs) => {
    setHeard(fin); setRes(null); setErr('')
    if (!onAnswer) return
    setBusy(true)
    try { setRes(await onAnswer(task, fin, secs)) }
    catch (e) { setErr(e.message || 'Assessment failed, try again') }
    finally { setBusy(false) }
  })
  return (
    <Card className="py-4">
      <CardContent className="text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium leading-relaxed">{task.prompt}</p>
          {SR && <MicButton onClick={listen} on={on} label="Answer aloud" />}
        </div>
        {model && <p className="mt-1.5 text-xs text-muted-foreground">Answer: {model}</p>}
        {on && live && <p className="mt-1.5 text-xs text-muted-foreground animate-pulse">&ldquo;{live}&rdquo;</p>}
        {busy && <p className="mt-1.5 text-xs text-muted-foreground">Scoring...</p>}
        {err && <p className="mt-1.5 text-xs text-red-600">{err}</p>}
        {heard && res && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            You said: &ldquo;{heard}&rdquo; · <b className="text-foreground">{Math.round(res.fluency)} fluency</b> · {Math.round(res.wpm)} wpm
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Repeat-aloud rows for repeat/read tasks (non-? speaking, no model key).
// These have no module mic outside Guided/Independent courses, so without
// this they are seeded and gated but unsubmittable. Same submit-text flow
// as question rows; the module mic covers them where canRecord is true.
export function RepeatPractice({ tasks, onAnswer, active }) {
  const reps = active
    ? (tasks || []).filter((t) => t.type === 'SPEAKING_RECORDING' && !/\?\s*$/.test(t.prompt || '') && !hasModel(t))
    : []
  if (!reps.length) return null
  return (
    <div className="mt-4 space-y-3">
      {reps.map((t) => <RepeatRow key={t.id} task={t} onAnswer={onAnswer} />)}
    </div>
  )
}

function RepeatRow({ task, onAnswer }) {
  const [heard, setHeard] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const { SR, live, on, listen } = useSpeechRecognition(async (fin, secs) => {
    setHeard(fin); setRes(null); setErr('')
    if (!onAnswer) return
    setBusy(true)
    try { setRes(await onAnswer(task, fin, secs)) }
    catch (e) { setErr(e.message || 'Assessment failed, try again') }
    finally { setBusy(false) }
  })
  return (
    <Card className="py-4">
      <CardContent className="text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium leading-relaxed">{task.prompt}</p>
          {SR && <MicButton onClick={listen} on={on} label="Read aloud" />}
        </div>
        {on && live && <p className="mt-1.5 text-xs text-muted-foreground animate-pulse">&ldquo;{live}&rdquo;</p>}
        {busy && <p className="mt-1.5 text-xs text-muted-foreground">Scoring...</p>}
        {err && <p className="mt-1.5 text-xs text-red-600">{err}</p>}
        {heard && res && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            You said: &ldquo;{heard}&rdquo; · <b className="text-foreground">{Math.round(res.fluency)} fluency</b> · {Math.round(res.wpm)} wpm
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Formative function cards: practice each example aloud, transcription-only.
// No tasks, no rows, no gate impact — the scored record lives on Instruction.
export function ExampleCards({ rows }) {
  if (!rows?.length) return null
  return (
    <div className="mt-4 space-y-3">
      {rows.map(([func, ex], i) => <ExampleCard key={i} func={func} example={ex} />)}
    </div>
  )
}

function ExampleCard({ func, example }) {
  const [heard, setHeard] = useState('')
  const { SR, live, on, listen } = useSpeechRecognition((fin) => setHeard(fin))
  const norm = (s) => s.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const ok = heard && (norm(heard).includes(norm(example)) || norm(example).includes(norm(heard)))
  return (
    <Card className="py-4">
      <CardContent className="text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium leading-relaxed">{func}</p>
          {SR && <MicButton onClick={listen} on={on} label={`Say: ${example}`} />}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">Example: {example}</p>
        {on && live && <p className="mt-1.5 text-xs text-muted-foreground animate-pulse">&ldquo;{live}&rdquo;</p>}
        {heard && (
          <p className={cn('mt-1.5 text-xs', ok ? 'text-green-600' : 'text-amber-600')}>
            {ok ? <><Check className="size-3.5 inline" /> Correct — </> : 'Try again — '}&ldquo;{heard}&rdquo;
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Function practice cards: one per language-function pair — name + a
// formative mic (transcription only, like VocabRow) + the example shown
// outright. Nothing here scores; the course gate counts the monologue only.
export function FunctionCards({ rows }) {
  if (!rows?.length) return null
  return (
    <div className="mt-4 space-y-3">
      {rows.map(([fn, ex], i) => <FunctionCard key={i} fn={fn} ex={ex} />)}
    </div>
  )
}

function FunctionCard({ fn, ex }) {
  const [heard, setHeard] = useState('')
  const { SR, live, on, listen } = useSpeechRecognition((fin) => setHeard(fin))
  return (
    <Card className="py-4">
      <CardContent className="text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium leading-relaxed">{fn}</p>
          {SR && <MicButton onClick={listen} on={on} label={`Say your ${fn} sentence`} />}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">Example: {ex}</p>
        {on && live && <p className="mt-1.5 text-xs text-muted-foreground animate-pulse">&ldquo;{live}&rdquo;</p>}
        {heard && <p className="mt-1.5 text-xs text-muted-foreground">You said: &ldquo;{heard}&rdquo;</p>}
      </CardContent>
    </Card>
  )
}

// ponytail: mirrors scoring.Words + WER backtrack priority so chips agree with
// the server accuracy; converges if the backend ever returns the alignment.
export function mispronounced(reference, transcribed) {
  const words = (s) => (String(s || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
  const ref = words(reference), hyp = words(transcribed)
  const dp = Array.from({ length: ref.length + 1 }, (_, a) => {
    const row = new Array(hyp.length + 1).fill(0)
    row[0] = a
    return row
  })
  for (let b = 0; b <= hyp.length; b++) dp[0][b] = b
  for (let a = 1; a <= ref.length; a++)
    for (let b = 1; b <= hyp.length; b++)
      dp[a][b] = Math.min(dp[a - 1][b] + 1, dp[a][b - 1] + 1, dp[a - 1][b - 1] + (ref[a - 1] === hyp[b - 1] ? 0 : 1))
  const bad = []
  for (let a = ref.length, b = hyp.length; a > 0 || b > 0;) {
    if (a > 0 && b > 0 && ref[a - 1] === hyp[b - 1]) { a--; b-- }
    else if (a > 0 && b > 0 && dp[a][b] === dp[a - 1][b - 1] + 1) { bad.unshift(ref[a - 1]); a--; b-- }
    else if (b > 0 && dp[a][b] === dp[a][b - 1] + 1) b--
    else { bad.unshift(ref[a - 1]); a-- }
  }
  return [...new Set(bad)]
}

export function WordsToFix({ reference, transcribed, words }) {
  const list = words?.length ? words : mispronounced(reference, transcribed)
  if (!list.length) return null
  return (
    <div>
      <div className="font-semibold mb-1">Words to fix</div>
      <div className="flex flex-wrap gap-1.5">
        {list.map((w) => <Badge key={w} variant="secondary">{w}</Badge>)}
      </div>
    </div>
  )
}

// ponytail: display-only book glossary (Table 1 shape) — deliberately separate
// from VocabTable (practice: speaker/mic/verdict); merging them regrows
// prop-flags. A "No" column mirrors the book numbering (seed order = book order).
// shortcut: meaning-column TTS suppressed only when the module declares
// Indonesian glosses ("Indonesian" in content_text — today just Boat Parts);
// an explicit per-module lang flag replaces the sniff when content grows.
// Trailing (parentheticals) are ID translations corpus-wide (Expressions),
// so TTS skips them; display keeps the full text.
function degloss(s) {
  return String(s || '').replace(/\s*\([^)]*\)/g, '').trim()
}

export function GlossaryTable({ rows, speakMeaning = true }) {
  if (!rows?.length) return null
  return (
    <Card className="mt-4 py-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">No</TableHead>
            <TableHead>Vocabulary</TableHead>
            <TableHead>Meaning</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([w, m], i) => (
            <TableRow key={i}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium whitespace-normal">
                <CellListen text={w} label={`Hear ${w}`} />
                {w}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-normal">
                {speakMeaning && degloss(m) && <CellListen text={degloss(m)} label="Hear meaning" />}
                {m}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

// ponytail: shape-detected (options carry "sentences" + lettered transcript) —
// an explicit task subtype ends the sniffing. Ungraded: keys are stripped by
// Task.Public, checking arrives with a check endpoint, not before.
export function parseStory(text) {
  const out = []
  for (const seg of String(text || '').split(/(?=[A-F]\.\s)/g)) {
    const m = seg.match(/^([A-F])\.\s*([\s\S]+?)\s*$/)
    if (m) out.push([m[1], m[2].trim()])
  }
  return out.length >= 2 ? out : []
}

export function StoryOrder({ bits, task, onCheck }) {
  const [order, setOrder] = useState([])
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  if (!bits?.length) return null
  async function check() {
    if (!onCheck || !task) return
    setBusy(true); setErr(''); setRes(null)
    try { setRes(await onCheck(task, order)) }
    catch (e) { setErr(e.message || 'Check failed') }
    finally { setBusy(false) }
  }
  const expected = res && res.expected && res.expected.order ? res.expected.order.join(' → ') : ''
  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-2">
        {bits.map(([l, s]) => {
          const pos = order.indexOf(l)
          return (
            <button
              key={l}
              onClick={() => setOrder(pos < 0 ? [...order, l] : order.filter((x) => x !== l))}
              className={cn(
                'flex items-center gap-3 text-left rounded-xl border px-4 py-2.5 text-sm transition-colors',
                pos < 0 ? 'hover:bg-accent' : 'bg-primary text-primary-foreground border-primary'
              )}
            >
              <span className={cn('w-6 h-6 rounded-md grid place-items-center text-xs font-bold shrink-0', pos < 0 ? 'bg-secondary' : 'bg-primary-foreground/20')}>
                {pos < 0 ? l : pos + 1}
              </span>
              <span className={pos < 0 ? 'text-muted-foreground' : ''}>{s}</span>
            </button>
          )
        })}
      </div>
      <Card className="py-4">
        <CardContent className="text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold">Your order {order.length > 0 && <span className="text-muted-foreground font-normal">— {order.join(' → ')}</span>}</div>
            {order.length > 0 && (
              <Button size="sm" variant="secondary" onClick={() => setOrder([])} className="rounded-full">
                Reset
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Tap a picked sentence again to unpick. Say your answer aloud.</p>
          {task && onCheck && (
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" onClick={check} disabled={busy || !order.length}>{busy ? '…' : 'Check'}</Button>
              {err && <span className="text-xs text-red-600">{err}</span>}
              {res && (
                <span className={cn('text-xs font-medium', res.correct ? 'text-green-600' : 'text-amber-600')}>
                  {res.correct ? 'Correct!' : <>Not quite — answer: <b>{expected}</b></>}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ponytail: "Name => Meaning." table rows — entries split on ";;" so glosses
// keep natural periods/parens; sentence-split is legacy fallback. "=>" never
// occurs in prose, so neither path misfires on passages.
export function parseTable(text) {
  const raw = String(text || '')
  const segs = raw.includes(';;') ? raw.split(/\s*;;\s*/) : raw.split(/(?<=[.?!])\s+/)
  const out = []
  for (const seg of segs) {
    const m = seg.match(/^(.+?)\s*=>\s*(.+?)\s*$/)
    if (m && m[2] && m[1].trim()) out.push([m[1].trim(), m[2].trim()])
  }
  return out.length >= 2 ? out : []
}

// ponytail: parses single-word-headed "Word: example." pairs (langExpr/guideVocab shape);
// multi-word heads ("Identifying and naming:") are function sections, not vocab — see LabeledSections.
export function parsePairs(text) {
  const out = []
  for (const seg of String(text || '').split(/(?<=[.?!])\s+/)) {
    const m = seg.match(/^([A-Za-z][\w-]*):\s*(.+[.?!])?\s*$/)
    if (m && m[2]) out.push([m[1], m[2].trim()])
  }
  return out.length >= 2 ? out : []
}

// Sectioned "Heading: sentence. sentence." blocks — one shape serves Language
// Function (book bullets) and Grammar Focus (term + example); ID glosses render
// when seeds carry them, never invented here.
// ponytail: colon-heading heuristic — misfires if a seed sentence ever starts
// "Like this:" mid-prose; a real `subtype` column ends the sniffing.
export function LabeledSections({ text }) {
  const parts = String(text || '').split(/\s*(?=[A-Z][^.:;?!]{2,50}:\s)/g).filter((s) => s.trim())
  if (!parts.length) return null
  return (
    <div className="mt-4 space-y-3">
      {parts.map((p, i) => {
        const m = p.match(/^([^.:;?!]{2,50}):\s*([\s\S]*)$/)
        if (!m) return <p key={i} className={`text-sm text-muted-foreground ${passageCls}`}>{p.trim()}</p>
        const sents = m[2].split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean)
        return (
          <Card key={i} className="py-4">
            <CardContent className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{m[1].trim()}</div>
                <ListenButton text={sents.join(' ')} />
              </div>
              <ul className="mt-1.5 list-disc list-inside space-y-1 text-muted-foreground">
                {sents.map((s, j) => <li key={j} className={passageCls}>{s}</li>)}
              </ul>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ponytail: prompt-only cards — student API strips answer keys (Task.Public);
// POST /tasks/:id/check reveals the key inside an attempt response.
function hasObjectives(t) {
  try { return Array.isArray(JSON.parse(t.options_json || '{}').objectives) } catch { return false }
}

// ponytail: in-memory ticks, formative only — persist per-student picks when
// goal tracking outgrows one sitting.
export function ObjectivesChecklist({ tasks }) {
  const task = (tasks || []).find(hasObjectives)
  const [done, setDone] = useState({})
  if (!task) return null
  let items = []
  try { items = JSON.parse(task.options_json).objectives || [] } catch { /* unshaped */ }
  if (!items.length) return null
  return (
    <Card className="mt-4">
      <CardContent className="pt-6 text-sm">
        <p className="font-medium leading-relaxed">{task.prompt}</p>
        <div className="mt-3 space-y-2">
          {items.map((it, i) => (
            <label key={i} className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 cursor-pointer">
              <input type="checkbox" className="mt-1" checked={!!done[i]}
                onChange={() => setDone((d) => ({ ...d, [i]: !d[i] }))} />
              <span className={cn(done[i] && 'line-through text-muted-foreground')}>{it}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Answer-first reveal: attempt required, key comes back inside the response.
// blank (N)____ markers are the fill-in syntax (Galah, Sarah&Dave). The count
// comes from the prompt itself: keys never reach the student API, so markers
// are assumed contiguous from 1.
function blankSlots(prompt) {
  const ns = [...String(prompt || '').matchAll(/\((\d+)\)\s*_{2,}/g)].map((m) => +m[1])
  if (!ns.length) return []
  return Array.from({ length: Math.max(...ns) }, (_, i) => i)
}

function CheckRow({ task, onCheck }) {
  const opt = (() => { try { return JSON.parse(task.options_json || '{}') } catch { return {} } })()
  const isMatch = !!opt.statements
  const slots = !isMatch ? blankSlots(task.prompt) : []
  const [single, setSingle] = useState('')
  const [vals, setVals] = useState(() => slots.map(() => ''))
  const [parts, setParts] = useState({})
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function check() {
    if (!onCheck) return
    setBusy(true); setErr(''); setRes(null)
    try {
      // ponytail: comma means sequence — explicit per-blank inputs when blanks need them.
      const answer = isMatch ? parts : slots.length ? vals : (single.includes(',') ? single.split(',').map((s) => s.trim()) : single)
      setRes(await onCheck(task, answer))
    } catch (e) { setErr(e.message || 'Check failed') } finally { setBusy(false) }
  }

  const expected = res ? (() => {
    const e = res.expected || {}
    if (e.correct) return e.correct
    if (e.blanks) return e.blanks.join(' / ')
    if (e.order) return e.order.join(' → ')
    if (e.answers) return e.answers.join(' / ')
    return Object.entries(e).map(([k, v]) => `${k}: ${v}`).join(', ')
  })() : ''

  return (
    <div className="mt-3">
      {isMatch ? (
        <div className="space-y-1.5">
          {Object.keys(opt.statements).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <b className="text-sm w-6">{k}.</b>
              <input value={parts[k] || ''} onChange={(e) => setParts((p) => ({ ...p, [k]: e.target.value.toUpperCase() }))}
                placeholder="Letter" maxLength={2}
                className="w-20 rounded-lg border bg-card px-3 py-1.5 text-sm uppercase text-center font-mono" />
              {res?.detail && (
                <span className={cn('text-xs font-medium', res.detail[k] ? 'text-green-600' : 'text-red-600')}>
                  {res.detail[k] ? 'Correct' : `Expected ${(res.expected || {})[k] || ''}`}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : slots.length ? (
        <div className="space-y-2">
          {String(task.prompt || '').split(/(?<=[.?!])\s+/).filter((s) => s.trim()).map((line, li) => (
            <div key={li} className="rounded-lg border bg-card px-3 py-2 text-sm leading-relaxed">
              {line.split(/(\(\d+\)\s*_{2,})/g).map((bit, bi) => {
                const m = bit.match(/^\((\d+)\)\s*_{2,}$/)
                if (!m) return <span key={bi}>{bit}</span>
                const idx = +m[1] - 1
                const ok = res?.detail?.[String(idx)]
                const want = (res?.expected?.blanks || [])[idx]
                return (
                  <span key={bi} className="inline-flex items-center gap-1.5 mx-1 align-middle">
                    <input value={vals[idx] || ''} onChange={(e) => setVals((v) => v.map((x, j) => (j === idx ? e.target.value : x)))}
                      placeholder={`(${m[1]})`} aria-label={`Answer ${m[1]}`}
                      className="w-24 rounded-lg border bg-card px-2 py-1 text-sm text-center" />
                    {res && (
                      <span className={cn('text-xs font-medium', ok ? 'text-green-600' : 'text-red-600')}>
                        {ok ? '✓' : want ? `→ ${want}` : '✗'}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      ) : (
        <input value={single} onChange={(e) => setSingle(e.target.value)}
          placeholder="Type your answer… (comma-separate sequences)"
          className="w-full rounded-lg border bg-card px-3 py-2 text-sm" />
      )}
      <div className="mt-2 flex items-center gap-2">
        <Button size="sm" onClick={check} disabled={busy}>{busy ? '…' : 'Check'}</Button>
        {err && <span className="text-xs text-red-600">{err}</span>}
        {res && (
          <span className={cn('text-xs font-medium', res.correct ? 'text-green-600' : 'text-amber-600')}>
            {res.correct ? 'Correct!' : <>Not quite — answer: <b>{expected}</b></>}
          </span>
        )}
      </div>
    </div>
  )
}

// ponytail: localStorage scratch (same as reflection) — no backend: the
// draft is an unscored speaking reference. Keyed by course so Create and
// Record share it. Single-device only; a drafts table ends that.
export function isDraftTask(t) {
  try { return !!JSON.parse(t.options_json || '{}').draft } catch { return false }
}

function draftKey(courseId) {
  return `asri_monologue_${courseId || 'misc'}`
}

export function DraftBox({ courseId }) {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(draftKey(courseId)) || '' } catch { return '' }
  })
  function save(v) {
    setText(v)
    try { localStorage.setItem(draftKey(courseId), v) } catch { /* best-effort */ }
  }
  return (
    <Card className="mt-4">
      <CardContent className="pt-6 text-sm">
        <textarea value={text} onChange={(e) => save(e.target.value.slice(0, 2000))} rows={8}
          placeholder="Type your monologue here…"
          className="w-full rounded-lg border bg-card px-3 py-2 text-sm leading-relaxed" />
        <p className="mt-1.5 text-xs text-muted-foreground">{text.length}/2000 · saved on this device · not scored</p>
      </CardContent>
    </Card>
  )
}

export function DraftReference({ courseId }) {
  const [text] = useState(() => {
    try { return localStorage.getItem(draftKey(courseId)) || '' } catch { return '' }
  })
  if (!text.trim()) return <p className="mt-4 text-sm text-muted-foreground">No draft yet — write one in Create My Monologue first.</p>
  return (
    <Card className="mt-4">
      <CardContent className="pt-6 text-sm">
        <div className="font-semibold mb-1">Your monologue</div>
        <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}

export function QuizList({ tasks, onCheck }) {
  if (!tasks?.length) return null
  return (
    <div className="mt-4 space-y-3">
      {tasks.filter((t) => t.type !== 'SPEAKING_RECORDING' && !hasSentences(t) && !hasObjectives(t) && !isDraftTask(t)).map((t, i) => {
        const opt = safeParse(t.options_json)
        return (
          <Card key={t.id} className="py-4">
            <CardContent className="text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t.type}</Badge>
                <span className="text-muted-foreground">Q{i + 1}</span>
                <span className="ml-auto"><ListenButton text={t.prompt} /></span>
              </div>
              {!blankSlots(t.prompt).length && <p className="mt-2 leading-relaxed whitespace-pre-wrap">{t.prompt}</p>}
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
              {onCheck && <CheckRow task={t} onCheck={onCheck} />}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
