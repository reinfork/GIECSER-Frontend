import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookOpenText, LayoutDashboard, LogOut } from 'lucide-react'
import { authFetch, getProfile, logout } from './auth'
import { ThemeToggle } from './theme'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function Layout() {
  const profile = getProfile()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [chapters, setChapters] = useState([])
  const [pendingChapters, setPendingChapters] = useState(true)
  const onLogout = () => { logout(); navigate('/') }

  useEffect(() => {
    authFetch('/chapters')
      .then((res) => setChapters(res.data || []))
      .catch(() => {})
      .finally(() => setPendingChapters(false))
  }, [])

  const item = (active) =>
    cn(
      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
      active ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    )

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-card border-r hidden md:flex flex-col">
        <div className="p-5 flex items-center gap-2 font-bold text-lg">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">A</span>
          Asri ASR
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <Link to="/dashboard" className={item(pathname === '/dashboard')}>
            <LayoutDashboard className="size-4" /> Dashboard
          </Link>
          {pendingChapters ? (
            <div className="space-y-1 px-4 py-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            chapters.map((c) => (
              <Link key={c.id} to={`/chapters/${c.id}`} className={item(pathname === `/chapters/${c.id}`)} title={c.title}>
                <BookOpenText className="size-4 shrink-0" />
                <span className="truncate">{c.title}</span>
              </Link>
            ))
          )}
        </nav>
        <div className="p-3">
          <Separator className="mb-3" />
          <div className="px-1 text-sm font-medium truncate">
            {profile?.kind === 'teacher' ? profile?.email : 'Kelas sesi'}
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={onLogout} className="flex-1 flex items-center justify-center gap-2 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-2 py-1.5">
              <LogOut className="size-4" /> Logout
            </button>
            <ThemeToggle className="text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-2 py-1.5" />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-3 border-b bg-card">
          <span className="font-bold">Asri</span>
          <div className="flex gap-2">
            <ThemeToggle className="text-sm px-2 py-1 rounded-md bg-secondary" />
            <Link to="/dashboard" className="text-sm px-2 py-1 rounded-md bg-secondary">Dashboard</Link>
          </div>
        </header>
        <main className="flex-1 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
