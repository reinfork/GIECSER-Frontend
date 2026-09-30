import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API, fetchMe, getUser } from '../auth'

export default function Dashboard() {
  const [courses, setCourses] = useState([])
  const [total, setTotal] = useState(0)
  const [pending, setPending] = useState(true)
  const user = getUser()

  async function fetchData() {
    setPending(true)
    try {
      const res = await fetch(`${API}/courses?page=1&limit=4`).then((r) => r.json())
      setCourses(res.data || [])
      setTotal(res.meta?.total ?? res.data?.length ?? 0)
    } catch { /* keep stale list */ } finally { setPending(false) }
  }

  useEffect(() => { fetchMe(); fetchData() }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome, {user?.name} — ASR English Practice</p>
        </div>
        <button onClick={fetchData} className="text-sm px-3 py-1 border rounded hover:bg-slate-50">Refresh</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-xl p-4 bg-white dark:bg-slate-900">
          <div className="text-sm text-slate-500">Courses</div>
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-xs text-slate-500">English ASR courses</div>
        </div>
        <div className="border rounded-xl p-4 bg-white dark:bg-slate-900">
          <div className="text-sm text-slate-500">Account</div>
          <div className="text-2xl font-bold">{user?.name}</div>
          <div className="text-xs text-slate-500">{user?.email}</div>
        </div>
        <div className="border rounded-xl p-4 bg-violet-600 text-white">
          <div className="text-sm text-white/80">Next Step</div>
          <div className="font-semibold">Practice Speaking</div>
          <Link to="/courses" className="inline-block mt-2 text-xs bg-white text-violet-600 px-3 py-1 rounded">Open Courses →</Link>
        </div>
      </div>

      <div className="border rounded-xl p-4 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent Courses</h2>
          <Link to="/courses" className="text-sm text-violet-600">View all</Link>
        </div>
        {pending ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {courses.map((c) => (
              <div key={c.id} className="border rounded-lg p-3">
                <div className="font-medium">{c.title}</div>
                <div className="text-sm text-slate-500 line-clamp-2">{c.description}</div>
                <Link to={`/courses/${c.id}`} className="text-xs text-violet-600 mt-2 inline-block">Practice →</Link>
              </div>
            ))}
            {courses.length === 0 && <div className="text-sm text-slate-500">No courses yet.</div>}
          </div>
        )}
      </div>
    </div>
  )
}
