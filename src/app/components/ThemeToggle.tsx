'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'

type Mode = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatches by rendering only after mount
  useEffect(() => setMounted(true), [])

  // Compute current mode only when mounted
  const current: Mode | undefined = useMemo(() => {
    if (!mounted) return undefined
    return theme === 'system'
      ? ((systemTheme as Mode) ?? 'light')
      : ((theme as Mode) ?? 'light')
  }, [mounted, theme, systemTheme])

  // Skeleton while mounting (prevents SSR/CSR diff)
  if (!mounted) {
    return (
      <div
        className="h-9 w-40 rounded-2xl border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-gray-900 animate-pulse"
        aria-hidden
      />
    )
  }

  const base =
    'px-3 py-1.5 text-xs sm:text-sm rounded-xl transition ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500/60'
  const inactive =
    'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  const active =
    'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'

  return (
    <div
      className="inline-flex items-center rounded-2xl border border-gray-300 dark:border-gray-700
                 bg-white dark:bg-gray-900 p-1 shadow-sm"
      role="tablist"
      aria-label="Theme"
    >
      <button
        type="button"
        role="tab"
        aria-selected={current === 'light'}
        className={`${base} ${current === 'light' ? active : inactive}`}
        onClick={() => setTheme('light')}
      >
        <span className="mr-1">🌞</span> Light
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={current === 'dark'}
        className={`${base} ${current === 'dark' ? active : inactive}`}
        onClick={() => setTheme('dark')}
      >
        <span className="mr-1">🌙</span> Dark
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={theme === 'system'}
        className={`${base} ${theme === 'system' ? active : inactive}`}
        onClick={() => setTheme('system')}
      >
        <span className="mr-1">🖥️</span> System
      </button>
    </div>
  )
}