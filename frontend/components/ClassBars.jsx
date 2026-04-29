'use client'

import { CLASS_COLORS } from '@/utils/constants'

export function ClassBars({ specs }) {
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

  const maxPct = sorted[0].pct

  return (
    <div className="space-y-1.5">
      {sorted.map(({ name, pct, color }) => (
        <div key={name} className="flex items-center gap-3">
          <span className="text-void-300 text-xs w-28 shrink-0 truncate">{name}</span>
          <div className="flex-1 bg-void-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(pct / maxPct) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="text-void-400 text-xs tabular-nums w-10 text-right shrink-0">
            {pct.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}
