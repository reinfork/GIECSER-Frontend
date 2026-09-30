import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getUser, logout } from './auth'

export default function Layout() {
  const user = getUser()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const onLogout = () => { logout(); navigate('/') }
  const link = (to, active) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${active ? 'bg-violet-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-5 flex items-center gap-2 font-bold text-lg border-b border-slate-200 dark:border-slate-800">
          <span className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">A</span>
          Asri ASR
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link to="/dashboard" className={link('/dashboard', pathname === '/dashboard')}>
            <span>◧</span> Dashboard
          </Link>
          <Link to="/courses" className={link('/courses', pathname.startsWith('/courses'))}>
            <span>▦</span> Courses
          </Link>
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-sm font-medium truncate">{user?.name}</div>
          <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          <button onClick={onLogout} className="mt-2 w-full text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded px-2 py-1">Logout</button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-3 border-b bg-white dark:bg-slate-900">
          <span className="font-bold">Asri</span>
          <div className="flex gap-2">
            <Link to="/dashboard" className="text-sm px-2 py-1 rounded bg-slate-100">Dashboard</Link>
            <Link to="/courses" className="text-sm px-2 py-1 rounded bg-slate-100">Courses</Link>
          </div>
        </header>
        <main className="flex-1 bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
