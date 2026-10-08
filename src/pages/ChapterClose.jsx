import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ChapterFeedbackPanel, readJSON } from '@/components/feedback'

const YES_NO = [
  'Did I speak fluently?',
  'Did I pronounce the words correctly?',
  'Did I use appropriate vocabulary?',
]
const WRITE = ['What was my biggest difficulty?', 'What should I improve?']

// ponytail: fixed book text for every chapter — parameterize only storage;
// split per-chapter variants when the book diverges.
function loadReflect(id) {
  return readJSON(`asri_reflect_${id}`, { yn: [null, null, null], tx: ['', ''] })
}

function Shell({ back, title, desc, children }) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to={back} className="text-sm text-primary">← Back to chapter</Link>
      <h1 className="text-2xl font-bold mt-3">{title}</h1>
      {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      {children}
    </div>
  )
}

function Reflection({ id }) {
  const [ans, setAns] = useState(() => loadReflect(id))
  function save(next) {
    setAns(next)
    try { localStorage.setItem(`asri_reflect_${id}`, JSON.stringify(next)) } catch { /* best-effort */ }
  }
  return (
    <Shell back={`/chapters/${id}`} title="Self Reflection" desc="">
      <Card className="mt-4">
        <CardContent className="pt-6 space-y-4 text-sm">
          {YES_NO.map((q, i) => (
            <div key={q} className="flex items-center justify-between gap-3">
              <span>{q}</span>
              <span className="flex gap-1.5 shrink-0">
                {['Yes', 'No'].map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={ans.yn[i] === v ? 'default' : 'outline'}
                    className="rounded-full w-14"
                    onClick={() => save({ ...ans, yn: ans.yn.map((x, j) => (j === i ? v : x)) })}
                  >
                    {v}
                  </Button>
                ))}
              </span>
            </div>
          ))}
          {WRITE.map((q, i) => (
            <div key={q} className="space-y-1.5">
              <div>{q}</div>
              <Input
                value={ans.tx[i] || ''}
                placeholder="..."
                onChange={(e) => save({ ...ans, tx: ans.tx.map((x, j) => (j === i ? e.target.value : x)) })}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </Shell>
  )
}

function Mastery({ id }) {
  const attempts = Object.values(readJSON(`asri_chapter_${id}`, {}))
  const weak = attempts
    .filter((a) => a.module_id)
    .sort((a, b) => a.word_accuracy - b.word_accuracy)
    .slice(0, 3)
  return (
    <Shell back={`/chapters/${id}`} title="Re-practice & Mastery" desc="">
      <ChapterFeedbackPanel chapterId={id} />
      {weak.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Re-practice</CardTitle>
            <CardDescription>Lowest accuracy first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {weak.map((a) => (
              <div key={a.task_id} className="flex items-center justify-between gap-3">
                <span className="truncate">{a.module_title || 'Module'}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary">{Math.round(a.word_accuracy)}%</Badge>
                  <Button size="sm" asChild>
                    <Link to={`/modules/${a.module_id}`}>Re-practice <ArrowRight className="size-4" /></Link>
                  </Button>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </Shell>
  )
}

export default function ChapterClose({ mode }) {
  const { id } = useParams()
  return mode === 'mastery' ? <Mastery id={id} /> : <Reflection id={id} />
}
