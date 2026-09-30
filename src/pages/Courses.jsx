import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../auth'

const limit = 6

export default function Courses() {
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [courses, setCourses] = useState([])
  const [pending, setPending] = useState(true)
  const [q, setQ] = useState('')

  const totalPages = Math.ceil(total / limit) || 1
  // ponytail: filters current page only — add ?q= server search when courses grow
  const filtered = useMemo(() =>
    q ? courses.filter((c) => c.title.toLowerCase().includes(q.toLowerCase())) : courses,
  [courses, q])

  async function fetchData() {
    setPending(true)
    try {
      const res = await fetch(`${API}/courses?page=${page}&limit=${limit}`).then((r) => r.json())
      setCourses(res.data || [])
      setTotal(res.meta?.total ?? res.data?.length ?? 0)
    } catch { /* keep stale list */ } finally { setPending(false) }
  }

  useEffect(() => { fetchData() }, [page])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Courses — English ASR Practice</h1>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="border rounded px-3 py-1 text-sm" />
        </div>
      </div>

      {pending ? (
        <div className="py-12 text-center text-sm">Loading...</div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c.id} className="border rounded-xl p-4 bg-white dark:bg-slate-900">
                <div className="font-semibold">{c.title}</div>
                <div className="text-xs text-slate-500">ID {c.id} • {c.lessons?.length ?? 0} lessons</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{c.description}</p>
                <div className="mt-3 flex gap-2">
                  <Link to={`/courses/${c.id}`} className="text-xs bg-violet-600 text-white px-2 py-1 rounded">Practice</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-slate-500">Total {total} • Page {page}/{totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
