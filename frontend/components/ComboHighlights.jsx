'use client'

import { CLASS_COLORS, FACTION_COLORS, getRaceDisplayName } from '@/utils/constants'

function ComboRow({ rank, combo, maxPct }) {
  const classColor = CLASS_COLORS[combo.class] || '#6b7280'
  const factionColor =
    combo.faction === 'alliance' ? FACTION_COLORS.alliance :
    combo.faction === 'horde'    ? FACTION_COLORS.horde :
                                   FACTION_COLORS.neutral
  const raceName = getRaceDisplayName(combo.race, combo.faction)
  const barWidth = maxPct > 0 ? Math.round((combo.pct / maxPct) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-void-600 text-xs w-4 shrink-0 text-right">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1 text-sm leading-tight">
          <span className="font-medium truncate" style={{ color: factionColor }}>{raceName}</span>
          <span className="text-void-600 shrink-0">·</span>
          <span className="font-medium truncate" style={{ color: classColor }}>{combo.class}</span>
        </div>
        <div className="mt-1.5 h-1 bg-void-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${barWidth}%`, backgroundColor: classColor }}
          />
        </div>
      </div>
      <span className="text-void-400 text-xs tabular-nums shrink-0">{combo.pct?.toFixed(2)}%</span>
    </div>
  )
}

export function ComboHighlights({ blob }) {
  if (!blob?.general?.combos?.length) return null

  const sorted = [...blob.general.combos].sort((a, b) => b.pct - a.pct)
  const top3    = sorted.slice(0, 3)
  const bottom3 = sorted.slice(-3).reverse()

  const total = blob.general.total?.toLocaleString() ?? ''

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="section-title">Most &amp; Least Popular Combos</h2>
        {total && (
          <span className="text-void-600 text-xs">General Population · {total} characters</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-void-400 text-xs font-medium uppercase tracking-wide mb-3">Most Popular</p>
          <div className="space-y-3">
            {top3.map((combo, i) => (
              <ComboRow key={i} rank={i + 1} combo={combo} maxPct={top3[0].pct} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-void-400 text-xs font-medium uppercase tracking-wide mb-3">Rarest</p>
          <div className="space-y-3">
            {bottom3.map((combo, i) => (
              <ComboRow key={i} rank={i + 1} combo={combo} maxPct={Math.max(...bottom3.map(c => c.pct))} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
