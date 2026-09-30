import { Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Outlet />
    </div>
  )
}
