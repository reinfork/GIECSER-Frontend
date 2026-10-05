import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { authFetch } from '../auth'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Courses() {
  const { id } = useParams()

  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [pending, setPending] = useState(true)

  useEffect(() => {
    setPending(true)
    Promise.all([
      authFetch(`/courses/${id}`).catch(() => null),
      authFetch(`/courses/${id}/modules`).catch(() => ({ data: [] })),
    ])
      .then(([co, list]) => { setCourse(co); setModules(list.data || []) })
      .finally(() => setPending(false))
  }, [id])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/dashboard" className="text-sm text-primary">← Back to dashboard</Link>

      {pending ? (
        <div className="mt-3 space-y-2"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></div>
      ) : !course ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Course not found.</div>
      ) : (
        <div className="mt-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="secondary">{modules.length} modules</Badge>
                  <h1 className="text-2xl font-bold mt-2">{course.title}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                </div>
                {modules.length > 0 && (
                  <Button asChild className="shrink-0 rounded-full">
                    <Link to={`/modules/${modules[0].id}`}>Continue Learning</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            {modules.length === 0 ? (
              <div className="py-6 text-sm text-muted-foreground text-center">No modules yet.</div>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {modules.map((m) => (
                  <AccordionItem key={m.id} value={m.id} className="border rounded-xl px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <span className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-secondary grid place-items-center text-sm font-bold">{m.order_index}</span>
                        <span className="font-medium">{m.title}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{m.content_text || m.target_transcript}</p>
                      <div className="mt-3">
                        <Button size="sm" asChild>
                          <Link to={`/modules/${m.id}`}>Open module <ArrowRight className="size-4" /></Link>
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
