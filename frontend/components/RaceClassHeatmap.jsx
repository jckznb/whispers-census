'use client'

import { useMemo, useState } from 'react'
import { CLASS_COLORS, CLASS_ORDER, VALID_COMBOS, NEUTRAL_RACES, getRaceDisplayName, getBaseRaceName } from '@/utils/constants'

/**
 * Race × Class heatmap grid.
 * Cell color intensity = relative popularity within the current context.
 * Click a cell to highlight that combo.
 */
export function RaceClassHeatmap({ data, specCombos = [] }) {
  const [selected, setSelected] = useState(null)

  const { races, classes, grid, maxCount } = useMemo(() => {
    // Build canonical race list from VALID_COMBOS so all valid combos always render,
    // even if a race has 0 characters in the current context.
    const allBaseRaces = [...new Set([...VALID_COMBOS].map(k => k.split('|')[0]))]
    const canonicalRaces = allBaseRaces.flatMap(r =>
      NEUTRAL_RACES.has(r) ? [`${r} (A)`, `${r} (H)`] : [r]
    )

    if (!data?.length) return { races: [], classes: CLASS_ORDER, grid: {}, maxCount: 1 }

    // Aggregate counts by (race, class)
    const counts = new Map()

    for (const row of data) {
      const baseName = row.races?.name
      const cls = row.classes?.name
      if (!baseName || !cls) continue
      const race = getRaceDisplayName(baseName, row.races?.faction)
      const key = `${race}|${cls}`
      counts.set(key, (counts.get(key) || 0) + row.count)
    }

    // Sort canonical races by total popularity; races with no data fall to the right
    const raceTotals = new Map()
    for (const [key, count] of counts) {
      const race = key.split('|')[0]
      raceTotals.set(race, (raceTotals.get(race) || 0) + count)
    }
    const sortedRaces = [...canonicalRaces].sort((a, b) => (raceTotals.get(b) || 0) - (raceTotals.get(a) || 0))
    const maxCount = Math.max(1, ...counts.values())

    return {
      races: sortedRaces,
      classes: CLASS_ORDER,
      grid: Object.fromEntries(counts),
      maxCount,
    }
  }, [data])

  if (!races.length) {
    return (
      <div className="text-void-500 text-sm text-center py-12">
        No data — run a crawl first
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse min-w-max">
        <thead>
          <tr>
            <th className="text-void-500 font-normal text-left pr-3 w-28" style={{ verticalAlign: 'bottom', paddingBottom: 6 }}>Class ↓ / Race →</th>
            {races.map(race => (
              <th
                key={race}
                className="font-medium text-void-300"
                style={{
                  minWidth: 28,
                  height: 96,
                  padding: 0,
                  verticalAlign: 'bottom',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    left: '50%',
                    whiteSpace: 'nowrap',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: 'inherit',
                    transformOrigin: 'left bottom',
                    transform: 'rotate(-35deg)',
                  }}
                >
                  {race}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classes.map(cls => (
            <tr key={cls} className="group">
              <td
                className="pr-3 py-0.5 whitespace-nowrap font-medium group-hover:brightness-125 transition-all"
                style={{ color: CLASS_COLORS[cls] || '#9ca3af' }}
              >
                {cls}
              </td>
              {races.map(race => {
                const comboKey = `${race}|${cls}`
                const count = grid[comboKey] || 0
                const valid = VALID_COMBOS.has(`${getBaseRaceName(race)}|${cls}`)
                const isSelected = selected === comboKey
                const intensity = valid && count > 0 ? Math.sqrt(count / maxCount) : 0
                const classColor = CLASS_COLORS[cls] || '#6b7280'

                return (
                  <td key={race} className="p-0.5">
                    {valid ? (
                      <button
                        onClick={() => setSelected(isSelected ? null : comboKey)}
                        title={`${race} ${cls}: ${count.toLocaleString()} characters`}
                        className={`w-6 h-5 rounded transition-all duration-150 block ${
                          isSelected ? 'ring-2 ring-yogg-eye ring-offset-1 ring-offset-void-900' : ''
                        }`}
                        style={{
                          backgroundColor: intensity > 0
                            ? `${classColor}${Math.round(intensity * 220).toString(16).padStart(2, '0')}`
                            : '#1a0a3033',
                          opacity: intensity > 0 ? 0.6 + intensity * 0.4 : 0.3,
                        }}
                      />
                    ) : (
                      <div className="w-6 h-5 rounded bg-void-950/50 opacity-20" />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (() => {
        const [race, cls] = selected.split('|')
        const count = grid[selected] || 0
        const baseRace = getBaseRaceName(race)

        // Spec breakdown for this race+class combo
        const cellSpecs = specCombos
          .filter(s => s.races?.name === baseRace && s.classes?.name === cls)
          .sort((a, b) => b.count - a.count)
        const specTotal = cellSpecs.reduce((s, r) => s + r.count, 0)

        return (
          <div className="mt-3 p-3 rounded-lg bg-void-800/60 border border-void-600/30 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: CLASS_COLORS[cls] }} className="font-semibold">{race} {cls}</span>
              <span className="text-void-400">{count.toLocaleString()} characters</span>
              <button
                onClick={() => setSelected(null)}
                className="ml-auto text-void-500 hover:text-void-300 text-xs"
              >
                ✕
              </button>
            </div>

            {cellSpecs.length > 0 && (
              <div className="space-y-1.5 mt-2 border-t border-void-700/40 pt-2">
                {cellSpecs.map(s => {
                  const pct = specTotal > 0 ? (s.count / specTotal) * 100 : 0
                  return (
                    <div key={s.specs?.name} className="flex items-center gap-2">
                      <span className="text-xs text-void-300 w-28 shrink-0">{s.specs?.name}</span>
                      <div className="flex-1 bg-void-700/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CLASS_COLORS[cls] || '#6b7280',
                            opacity: 0.8,
                          }}
                        />
                      </div>
                      <span className="text-xs text-void-400 w-10 text-right tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
