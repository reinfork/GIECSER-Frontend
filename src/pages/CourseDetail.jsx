import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { authFetch } from '../auth'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const closing = [
  { key: 'reflection', title: 'Self Reflection', desc: 'Evaluasi diri setelah memperoleh feedback.', to: (id) => `/chapters/${id}/reflection` },
  { key: 'mastery', title: 'Re-practice & Mastery', desc: 'Feedback chapter, re-practice, dan enrichment.', to: (id) => `/chapters/${id}/mastery` },
]

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
      <Link to="/dashboard" className="text-sm text-primary">← Back to dashboard</Link>

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
                  <Badge variant="secondary">{courses.length + closing.length} courses</Badge>
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

          <div className="mt-6">
            {courses.length === 0 && (
              <div className="py-6 text-sm text-muted-foreground text-center">No courses yet.</div>
            )}
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
              {closing.map((c, i) => (
                <AccordionItem key={c.key} value={c.key} className="border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-secondary grid place-items-center text-sm font-bold">{courses.length + i + 1}</span>
                      <span className="font-medium">{c.title}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">{c.desc}</p>
                    <div className="mt-3">
                      <Button size="sm" asChild>
                        <Link to={c.to(id)}>Open <ArrowRight className="size-4" /></Link>
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}
    </div>
  )
}
