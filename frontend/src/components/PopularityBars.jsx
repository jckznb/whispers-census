import { useMemo, useState } from 'react'
import { CLASS_COLORS, FACTION_COLORS, ROLE_COLORS, getRaceDisplayName } from '../utils/constants'

/**
 * Horizontal sorted bar chart for demographic data.
 * groupBy: 'class' | 'race' | 'spec'
 *
 * Shows the first INITIAL_VISIBLE rows, with a "Show all" toggle to expand.
 */
const INITIAL_VISIBLE = 25

export function PopularityBars({ data, groupBy = 'class' }) {
  const [expanded, setExpanded] = useState(false)

  const groups = useMemo(() => {
    if (!data?.length) return []

    const map = new Map()

    for (const row of data) {
      let key, label, color, meta

      if (groupBy === 'class') {
        const name = row.classes?.name
        if (!name) continue
        key = name
        label = name
        color = CLASS_COLORS[name] || '#6b7280'
        meta = null
      } else if (groupBy === 'race') {
        const name = row.races?.name
        if (!name) continue
        key = getRaceDisplayName(name, row.races?.faction)
        label = key
        color = FACTION_COLORS[row.races?.faction] || '#6b7280'
        meta = row.races?.faction
      } else if (groupBy === 'spec') {
        const specName = row.specs?.name
        const className = row.classes?.name
        if (!specName || !className) continue
        key = `${specName}|${className}`
        label = specName
        color = CLASS_COLORS[className] || '#6b7280'
        meta = className
      }

      const existing = map.get(key)
      if (existing) {
        existing.count += row.count
      } else {
        map.set(key, { key, label, color, meta, count: row.count })
      }
    }

    const sorted = [...map.values()].sort((a, b) => b.count - a.count)
    const total = sorted.reduce((s, r) => s + r.count, 0)

    return sorted.map(r => ({
      ...r,
      pct: total > 0 ? (r.count / total) * 100 : 0,
    }))
  }, [data, groupBy])

  if (!groups.length) {
    return (
      <div className="text-void-500 text-sm text-center py-8">
        No data available
      </div>
    )
  }

  const maxPct = groups[0]?.pct || 1
  const visible = expanded ? groups : groups.slice(0, INITIAL_VISIBLE)
  const hiddenCount = groups.length - INITIAL_VISIBLE

  return (
    <div>
      <div className="space-y-2">
        {visible.map((g, i) => (
          <div key={g.key} className="flex items-center gap-3">
            {/* Rank */}
            <span className="text-void-500 text-xs w-5 text-right shrink-0">{i + 1}</span>

            {/* Label */}
            <div className="w-32 shrink-0">
              <span className="text-sm font-medium truncate block" style={{ color: g.color }}>
                {g.label}
              </span>
              {g.meta && (
                <span className="text-xs text-void-500 truncate block">{g.meta}</span>
              )}
            </div>

            {/* Bar */}
            <div className="flex-1 bg-void-800/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(g.pct / maxPct) * 100}%`,
                  backgroundColor: g.color,
                  opacity: 0.85,
                }}
              />
            </div>

            {/* Percentage */}
            <span className="text-void-300 text-xs w-12 text-right shrink-0 tabular-nums">
              {g.pct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Expand / collapse toggle — only shown when there are more rows */}
      {hiddenCount > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-void-400 hover:text-void-200 text-sm transition-colors"
          >
            {expanded
              ? `Show less ↑`
              : `Show all ${groups.length} (${hiddenCount} more) ↓`
            }
          </button>
        </div>
      )}
    </div>
  )
}
