'use client'

const ROLE_COLORS = {
  tank:   '#3b82f6',
  healer: '#10b981',
  damage: '#f59e0b',
}

const ROLE_LABELS = { tank: 'Tank', healer: 'Healer', damage: 'DPS' }

function DonutSegment({ pct, color, cumulativePct }) {
  const r = 38
  const C = 2 * Math.PI * r
  const segLen = (pct / 100) * C
  const offset = C * 0.25 - (cumulativePct / 100) * C
  return (
    <circle
      cx="50" cy="50" r={r}
      fill="none"
      stroke={color}
      strokeWidth="16"
      strokeDasharray={`${segLen} ${C - segLen}`}
      strokeDashoffset={offset}
    />
  )
}

export function RoleDonut({ specs }) {
  const totals = { tank: 0, healer: 0, damage: 0 }
  ;(specs || []).forEach(s => {
    const role = s.role ?? s.specs?.role
    if (totals[role] !== undefined) totals[role] += s.count ?? s.percentage ?? 0
  })

  const total = totals.tank + totals.healer + totals.damage
  if (total === 0) return null

  const pcts = {
    tank:   (totals.tank   / total) * 100,
    healer: (totals.healer / total) * 100,
    damage: (totals.damage / total) * 100,
  }

  let cumulative = 0
  const segments = Object.entries(pcts).map(([role, pct]) => {
    const seg = { role, pct, color: ROLE_COLORS[role], cumulativePct: cumulative }
    cumulative += pct
    return seg
  })

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-32 h-32 shrink-0 -rotate-90">
        {/* Track */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="#1a0a30" strokeWidth="16" />
        {segments.map(s => (
          <DonutSegment key={s.role} pct={s.pct} color={s.color} cumulativePct={s.cumulativePct} />
        ))}
      </svg>

      <div className="flex flex-col gap-3">
        {segments.map(({ role, pct, color }) => (
          <div key={role} className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-void-200 text-sm font-medium min-w-[3.5rem]">{ROLE_LABELS[role]}</span>
            <span className="text-void-100 text-lg font-semibold tabular-nums">{pct.toFixed(1)}<span className="text-void-500 text-sm font-normal">%</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}
