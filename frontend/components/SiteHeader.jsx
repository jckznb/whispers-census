'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { CLASS_NAV, RACE_NAV } from '@/utils/seo-nav'

function NavDropdown({ label, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-void-300
                   hover:text-void-100 hover:bg-void-700/40 rounded-md transition-colors"
      >
        {label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[220px] card bg-void-800 shadow-xl shadow-black/50
                        p-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  )
}

function ClassDropdownContent() {
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {CLASS_NAV.map(({ slug, name }) => (
        <Link key={slug} href={`/${slug}`}
              className="px-2 py-1.5 text-sm text-void-300 hover:text-void-100
                         hover:bg-void-700/50 rounded transition-colors truncate">
          {name}
        </Link>
      ))}
    </div>
  )
}

function RaceDropdownContent() {
  const sections = [
    { label: 'Alliance', color: '#1a6eb5', races: RACE_NAV.alliance },
    { label: 'Horde',    color: '#8c1c1c', races: RACE_NAV.horde },
    { label: 'Neutral',  color: '#6b7280', races: RACE_NAV.neutral },
  ]
  return (
    <div className="space-y-3">
      {sections.map(({ label, color, races }) => (
        <div key={label}>
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider"
             style={{ color }}>
            {label}
          </p>
          <div className="grid grid-cols-2 gap-0.5">
            {races.map(({ slug, name }) => (
              <Link key={slug} href={`/${slug}`}
                    className="px-2 py-1.5 text-sm text-void-300 hover:text-void-100
                               hover:bg-void-700/50 rounded transition-colors truncate">
                {name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SiteHeader() {
  return (
    <header className="border-b border-void-700/40 bg-void-900/80 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.png" alt="Whispers Census" className="w-8 h-8 rounded-sm" />
          <span className="font-display font-semibold text-void-100 tracking-wide hidden sm:block">
            Whispers Census
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          <NavDropdown label="Classes">
            <ClassDropdownContent />
          </NavDropdown>
          <NavDropdown label="Races">
            <RaceDropdownContent />
          </NavDropdown>
        </nav>

        <Link href="/" className="ml-auto text-xs text-void-500 hover:text-void-300 transition-colors">
          ← Back to Census
        </Link>
      </div>
    </header>
  )
}
