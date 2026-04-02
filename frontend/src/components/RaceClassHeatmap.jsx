import { useMemo, useState } from 'react'
import { CLASS_COLORS, CLASS_ORDER, VALID_COMBOS } from '../utils/constants'

/**
 * Race × Class heatmap grid.
 * Cell color intensity = relative popularity within the current context.
 * Click a cell to highlight that combo.
 */
export function RaceClassHeatmap({ data }) {
  const [selected, setSelected] = useState(null)

  const { races, classes, grid, maxCount } = useMemo(() => {
    if (!data?.length) return { races: [], classes: CLASS_ORDER, grid: {}, maxCount: 1 }

    // Aggregate counts by (race, class)
    const counts = new Map()
    const raceSet = new Set()

    for (const row of data) {
      const race = row.races?.name
      const cls = row.classes?.name
      if (!race || !cls) continue
      raceSet.add(race)
      const key = `${race}|${cls}`
      counts.set(key, (counts.get(key) || 0) + row.count)
    }

    const raceList = [...raceSet].sort()
    const maxCount = Math.max(1, ...counts.values())

    return {
      races: raceList,
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
            <th className="text-void-500 font-normal text-left pb-2 pr-3 w-28">Race ↓ / Class →</th>
            {classes.map(cls => (
              <th
                key={cls}
                className="pb-2 px-1 font-medium text-center"
                style={{ color: CLASS_COLORS[cls] || '#9ca3af', writingMode: 'vertical-rl', minWidth: 28 }}
              >
                {cls}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {races.map(race => (
            <tr key={race} className="group">
              <td className="pr-3 py-0.5 text-void-300 whitespace-nowrap font-medium group-hover:text-void-100 transition-colors">
                {race}
              </td>
              {classes.map(cls => {
                const comboKey = `${race}|${cls}`
                const count = grid[comboKey] || 0
                const valid = VALID_COMBOS.has(comboKey)
                const isSelected = selected === comboKey
                const intensity = valid && count > 0 ? Math.sqrt(count / maxCount) : 0
                const classColor = CLASS_COLORS[cls] || '#6b7280'

                return (
                  <td key={cls} className="p-0.5">
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
        return (
          <div className="mt-3 p-3 rounded-lg bg-void-800/60 border border-void-600/30 text-sm">
            <span style={{ color: CLASS_COLORS[cls] }} className="font-semibold">{race} {cls}</span>
            <span className="text-void-300 ml-2">{count.toLocaleString()} characters</span>
            <button
              onClick={() => setSelected(null)}
              className="ml-3 text-void-500 hover:text-void-300 text-xs"
            >
              ✕ clear
            </button>
          </div>
        )
      })()}
    </div>
  )
}
