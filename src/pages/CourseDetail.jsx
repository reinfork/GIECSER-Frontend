import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API, authFetch } from '../auth'

const limit = 10

export default function CourseDetail() {
  const { id } = useParams()

  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [pendingCourse, setPendingCourse] = useState(true)
  const [pendingLessons, setPendingLessons] = useState(true)
  const [page, setPage] = useState(1)
  const recognition = useRef(null)
  const practiceRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [practiceLesson, setPracticeLesson] = useState(null)

  function initSpeech() {
    const w = window
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return null
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = async (e) => {
      setTranscript(e.results[0][0].transcript)
      setIsRecording(false)
      await computeScoreBackend(e.results[0][0].transcript)
    }
    rec.onerror = () => setIsRecording(false)
    rec.onend = () => setIsRecording(false)
    return rec
  }

  async function computeScoreBackend(transcriptText) {
    const lesson = practiceRef.current
    if (!lesson) return
    try {
      const res = await authFetch(`/lessons/${lesson.id}/practice`, {
        method: 'POST',
        body: JSON.stringify({ transcript: transcriptText }),
      })
      setScore(res.score)
      setFeedback(res.feedback)
    } catch {
      // ponytail: word-match fallback kept verbatim — phoneme scoring (e.g. Azure) when accuracy matters
      const target = lesson.target_text || ''
      const a = transcriptText.toLowerCase().trim().split(/\s+/)
      const b = target.toLowerCase().trim().split(/\s+/)
      let match = 0
      b.forEach((w) => { if (a.includes(w)) match++ })
      const s = b.length ? Math.round(match / b.length * 100) : 0
      setScore(s)
      setFeedback(s >= 90 ? 'Excellent!' : s >= 70 ? 'Good!' : 'Keep practicing')
    }
  }

  function startRecording(lesson) {
    // ponytail: ref (not state) feeds the speech callback — state closures go stale across recordings
    if (lesson) { practiceRef.current = lesson; setPracticeLesson(lesson); setTranscript(''); setScore(null); setFeedback('') }
    if (!recognition.current) recognition.current = initSpeech()
    if (!recognition.current) { alert('Web Speech API not supported in this browser'); return }
    setTranscript(''); setScore(null); setFeedback(''); setIsRecording(true)
    try { recognition.current.start() } catch { /* already started */ }
  }

  async function fetchCourse() {
    setPendingCourse(true)
    try { setCourse(await fetch(`${API}/courses/${id}`).then((r) => r.json())) }
    catch { /* keep null */ } finally { setPendingCourse(false) }
  }

  async function fetchLessons() {
    setPendingLessons(true)
    try {
      const res = await fetch(`${API}/courses/${id}/lessons?page=${page}&limit=${limit}`).then((r) => r.json())
      setLessons(res.data || [])
    } catch { /* keep stale list */ } finally { setPendingLessons(false) }
  }

  useEffect(() => { fetchCourse() }, [id])
  useEffect(() => { fetchLessons() }, [page])

  return (
    <div className="p-6">
      <Link to="/courses" className="text-sm text-violet-600">← Back to courses</Link>
      {pendingCourse ? (
        <div className="py-8 text-center text-sm">Loading course...</div>
      ) : course ? (
        <div className="mt-3">
          <div className="border rounded-xl p-5 bg-white dark:bg-slate-900">
            <h1 className="text-xl font-bold">{course.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{course.description}</p>
            <div className="text-xs text-slate-400 mt-2">{lessons.length} lessons • Created {new Date(course.created_at).toLocaleDateString()}</div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <h2 className="font-semibold">Lessons — Speaking Practice</h2>
          </div>

          {pendingLessons ? (
            <div className="py-6 text-sm text-slate-500">Loading lessons...</div>
          ) : lessons.length === 0 ? (
            <div className="py-6 text-sm text-slate-500 text-center">No lessons yet.</div>
          ) : (
            <div className="space-y-3 mt-3">
              {lessons.map((l) => (
                <div key={l.id} className="border rounded-xl p-4 bg-white dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 grid place-items-center text-sm font-bold text-violet-700">{l.order_index}</span>
                      <div>
                        <div className="font-medium">{l.title}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{l.target_text}</div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => startRecording(l)} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">{isRecording && practiceLesson?.id === l.id ? 'Listening...' : '🎤 Practice'}</button>
                          {transcript && practiceLesson?.id === l.id && (
                            <span className="text-xs text-slate-500">Heard: "{transcript}" {score !== null && <span className="font-bold text-emerald-600">Score {score}% — {feedback}</span>}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-center gap-1 mt-3">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-2 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
                <span className="text-sm px-2 py-1">Page {page}</span>
                <button onClick={() => setPage(page + 1)} className="px-2 py-1 border rounded text-sm">Next</button>
              </div>

              {/* global transcript */}
              {transcript && score !== null && (
                <div className="border rounded p-3 text-sm bg-emerald-50 dark:bg-emerald-950/20">
                  Last transcript: "{transcript}" <span className="font-bold">Score {score}% — {feedback}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
