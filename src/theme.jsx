import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function currentTheme() {
  return localStorage.getItem('theme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

export function applyTheme(t) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  localStorage.setItem('theme', t)
}

applyTheme(currentTheme()) // runs at import, before first paint — no light-flash
// ponytail: static choice, no live OS-follow — add matchMedia listener when anyone asks

export function ThemeToggle({ className = '' }) {
  const [t, setT] = useState(currentTheme())
  const flip = () => { const n = t === 'dark' ? 'light' : 'dark'; setT(n); applyTheme(n) }
  return (
    <button onClick={flip} aria-label="Toggle theme" title="Toggle theme" className={className}>
      {t === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
