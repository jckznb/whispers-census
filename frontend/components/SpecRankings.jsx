'use client'

import { useState } from 'react'
import { CLASS_COLORS } from '@/utils/constants'

const ROLE_COLORS = {
  tank:   '#3b82f6',
  healer: '#10b981',
  damage: '#f59e0b',
}

const ROLE_LABELS = { tank: 'Tank', healer: 'Healer', damage: 'DPS' }

function SpecBar({ rank, className, specName, displayPct, barWidthPct, roleFiltered }) {
  const color = CLASS_COLORS[className] ?? '#9b6dff'
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-void-600 text-xs w-4 text-right shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-void-200 truncate">
            {specName}{' '}
            <span className="text-void-500 font-normal">{className}</span>
          </span>
          <span className="text-xs text-void-400 shrink-0">{displayPct.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-void-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${barWidthPct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  )
}

export function SpecRankings({ specs }) {
  const [activeRole, setActiveRole] = useState('all')

  const normalized = (specs || []).map(s => ({
    className: s.class ?? s.classes?.name,
    specName:  s.spec  ?? s.specs?.name,
    role:      s.role  ?? s.specs?.role,
    count:     s.count,
    pct:       s.pct   ?? s.percentage,
  })).filter(s => s.className && s.specName)

  const filtered = activeRole === 'all'
    ? normalized
    : normalized.filter(s => s.role === activeRole)

  // When role-filtered, recalculate percentages within that role
  const roleTotal = activeRole !== 'all'
    ? filtered.reduce((sum, s) => sum + s.count, 0)
    : 0

  const sorted = [...filtered].sort((a, b) => b.count - a.count)

  const getDisplayPct = s =>
    activeRole === 'all' ? s.pct : (s.count / roleTotal) * 100

  const maxDisplayPct = sorted.length > 0 ? getDisplayPct(sorted[0]) : 1

  const roles = ['all', 'tank', 'healer', 'damage']

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {/* Role filter tabs */}
        <div className="flex gap-1">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeRole === role
                  ? 'bg-void-600/60 text-void-100'
                  : 'text-void-500 hover:text-void-300'
              }`}
              style={activeRole === role && role !== 'all'
                ? { backgroundColor: `${ROLE_COLORS[role]}25`, color: ROLE_COLORS[role] }
                : {}
              }
            >
              {role === 'all' ? 'All Specs' : ROLE_LABELS[role]}
            </button>
          ))}
        </div>

        {/* Context label */}
        {activeRole !== 'all' && (
          <span className="text-void-600 text-xs">% of {ROLE_LABELS[activeRole]}s</span>
        )}
      </div>

      <div className="space-y-0.5">
        {sorted.map((s, i) => {
          const displayPct = getDisplayPct(s)
          return (
            <SpecBar
              key={`${s.className}-${s.specName}`}
              rank={i + 1}
              className={s.className}
              specName={s.specName}
              role={s.role}
              displayPct={displayPct}
              barWidthPct={(displayPct / maxDisplayPct) * 100}
            />
          )
        })}
      </div>
    </div>
  )
}
