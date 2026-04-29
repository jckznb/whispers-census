'use client'

import { CLASS_COLORS } from '@/utils/constants'

const R = 38
const C = 2 * Math.PI * R

function DonutSegment({ pct, color, cumulativePct }) {
  const segLen  = (pct / 100) * C
  const gap     = Math.min(2, segLen * 0.08)
  const visible = Math.max(0, segLen - gap)
  const offset  = C * 0.25 - (cumulativePct / 100) * C
  return (
    <circle
      cx="50" cy="50" r={R}
      fill="none"
      stroke={color}
      strokeWidth="16"
      strokeDasharray={`${visible} ${C - visible}`}
      strokeDashoffset={offset}
    />
  )
}

export function ClassDonut({ specs }) {
  const classTotals = {}
  ;(specs || []).forEach(s => {
    const name = s.class ?? s.classes?.name
    if (name) classTotals[name] = (classTotals[name] ?? 0) + (s.count ?? 0)
  })

  const total = Object.values(classTotals).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  const sorted = Object.entries(classTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      pct: (count / total) * 100,
      color: CLASS_COLORS[name] ?? '#9b6dff',
    }))

  let cumulative = 0
  const segments = sorted.map(s => {
    const seg = { ...s, cumulativePct: cumulative }
    cumulative += s.pct
    return seg
  })

  return (
    <div className="flex flex-wrap items-start gap-6">
      <svg viewBox="0 0 100 100" className="w-36 h-36 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#1a0a30" strokeWidth="16" />
        {segments.map(s => (
          <DonutSegment key={s.name} pct={s.pct} color={s.color} cumulativePct={s.cumulativePct} />
        ))}
      </svg>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 flex-1 min-w-[200px]">
        {sorted.map(({ name, pct, color }) => (
          <div key={name} className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-void-300 text-xs truncate">{name}</span>
            <span className="text-void-500 text-xs ml-auto tabular-nums">{pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
