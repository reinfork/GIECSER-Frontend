import { useState } from 'react'
import { Check, ExternalLink, Mic, Volume2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

// Plain statement card for goal/reference modules (no speaking task attached).
// YAGNI: no progress, no checklist — the seed stores goals as plain text.
export function GoalBlock({ content, transcript }) {
  const say = transcript && transcript !== content ? `${content}. ${transcript}` : (transcript || content)
  return (
    <Card className="mt-4">
      <CardContent className="pt-6 text-sm leading-relaxed whitespace-pre-wrap">
        <div className="mb-3"><ListenButton text={say} /></div>
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
        if (!t.speaker) {
          return (
            <p key={i} className="text-sm text-muted-foreground">
              {t.line}{' '}
              <button onClick={() => speakText(t.line)} aria-label="Hear narration" className="align-middle hover:text-foreground">
                <Volume2 className="size-3.5 inline" />
              </button>
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
export function ListenButton({ text }) {
  if (!String(text || '').trim()) return null
  return (
    <button onClick={() => speakText(text)} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-secondary/70">
      <Volume2 className="size-4" /> Listen
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

// ponytail: SpeechRecognition is Chrome/Edge-only — mic hides elsewhere, TTS
// speaker stays; transcription-only by supervisor call, no scoring path.
function VocabRow({ word, example }) {
  const [heard, setHeard] = useState('')
  const [live, setLive] = useState('')
  const [on, setOn] = useState(false)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  function listen() {
    if (!SR) return
    if (on) return
    const r = new SR()
    r.lang = 'en-US'
    r.interimResults = true
    r.maxAlternatives = 1
    setOn(true); setLive('')
    r.onresult = (e) => {
      let interim = '', fin = ''
      for (const res of e.results) {
        if (res.isFinal) fin += res[0].transcript
        else interim += res[0].transcript
      }
      if (interim) setLive(interim)
      if (fin) { setHeard(fin); setLive(''); setOn(false) }
    }
    r.onend = () => { setOn(false); setLive('') }
    r.onerror = () => { setOn(false); setLive('') }
    try { r.start() } catch { setOn(false) }
  }
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
        {SR && (
          <button onClick={listen} aria-label={`Say ${word}`} className={cn('rounded-full bg-secondary p-1.5 hover:bg-secondary/70', on && 'animate-pulse bg-red-100 text-red-600')}>
            <Mic className="size-4" />
          </button>
        )}
      </TableCell>
      {example != null && <TableCell className="text-muted-foreground whitespace-normal">{example}</TableCell>}
      <TableCell className="text-right">
        <button onClick={() => speakText(word)} aria-label={`Hear ${word}`} className="text-muted-foreground hover:text-foreground">
          <Volume2 className="size-4" />
        </button>
      </TableCell>
    </TableRow>
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
export function GlossaryTable({ rows }) {
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
              <TableCell className="font-medium whitespace-normal">{w}</TableCell>
              <TableCell className="text-muted-foreground whitespace-normal">{m}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

// ponytail: "Name => Meaning." table rows (Table 1 shape) — tried before
// parsePairs since game names are multi-word; "=>" never occurs in prose.
export function parseTable(text) {
  const out = []
  for (const seg of String(text || '').split(/(?<=[.?!])\s+/)) {
    const m = seg.match(/^(.+?)\s*=>\s*(.+[.?!])?\s*$/)
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
  const parts = String(text || '').split(/\s*(?=[A-Z][^.:;]{2,50}:\s)/g).filter((s) => s.trim())
  if (!parts.length) return null
  return (
    <div className="mt-4 space-y-3">
      {parts.map((p, i) => {
        const m = p.match(/^([^.:;]{2,50}):\s*([\s\S]*)$/)
        if (!m) return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p.trim()}</p>
        const sents = m[2].split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean)
        return (
          <Card key={i} className="py-4">
            <CardContent className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{m[1].trim()}</div>
                <ListenButton text={sents.join(' ')} />
              </div>
              <ul className="mt-1.5 list-disc list-inside space-y-1 text-muted-foreground">
                {sents.map((s, j) => <li key={j} className="leading-relaxed">{s}</li>)}
              </ul>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
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
                <span className="ml-auto"><ListenButton text={t.prompt} /></span>
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
