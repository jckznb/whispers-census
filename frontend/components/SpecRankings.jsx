'use client'

import { useState } from 'react'
import { CLASS_COLORS } from '@/utils/constants'

const ROLE_COLORS = {
  tank:   '#3b82f6',
  healer: '#10b981',
  damage: '#f59e0b',
}

const ROLE_LABELS = { tank: 'Tank', healer: 'Healer', damage: 'DPS' }

function SpecBar({ rank, className, specName, actualPct, barWidthPct }) {
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
          <span className="text-xs text-void-400 shrink-0">{actualPct.toFixed(1)}%</span>
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

  const sorted = [...filtered].sort((a, b) => b.count - a.count)
  const maxPct = sorted[0]?.pct ?? 1

  const roles = ['all', 'tank', 'healer', 'damage']

  return (
    <div>
      {/* Role filter tabs */}
      <div className="flex gap-1 mb-4">
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

      <div className="space-y-0.5">
        {sorted.map((s, i) => (
          <SpecBar
            key={`${s.className}-${s.specName}`}
            rank={i + 1}
            className={s.className}
            specName={s.specName}
            role={s.role}
            actualPct={s.pct}
            barWidthPct={(s.pct / maxPct) * 100}
          />
        ))}
      </div>
    </div>
  )
}
