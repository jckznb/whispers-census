import { useMemo, useState } from 'react'
import { CLASS_COLORS, FACTION_COLORS } from '../utils/constants'

/**
 * "Pick a race, see class breakdown" / "Pick a class, see race breakdown" explorer.
 * The altaholic's main tool for finding rare combos.
 */
export function ComboExplorer({ data }) {
  const [mode, setMode] = useState('race')   // 'race' = pick race → see classes
  const [selected, setSelected] = useState(null)

  const { primaryList, breakdown } = useMemo(() => {
    if (!data?.length) return { primaryList: [], breakdown: [] }

    // Build aggregated counts
    const raceMap = new Map()
    const classMap = new Map()
    const comboCounts = new Map()

    for (const row of data) {
      const race = row.races?.name
      const cls = row.classes?.name
      if (!race || !cls) continue

      raceMap.set(race, {
        name: race,
        faction: row.races?.faction,
        count: (raceMap.get(race)?.count || 0) + row.count,
      })
      classMap.set(cls, {
        name: cls,
        count: (classMap.get(cls)?.count || 0) + row.count,
      })

      const key = `${race}||${cls}`
      comboCounts.set(key, (comboCounts.get(key) || 0) + row.count)
    }

    const primaryList = mode === 'race'
      ? [...raceMap.values()].sort((a, b) => b.count - a.count)
      : [...classMap.values()].sort((a, b) => b.count - a.count)

    if (!selected) return { primaryList, breakdown: [] }

    // Build breakdown for the selected item
    const entries = []
    for (const [key, count] of comboCounts) {
      const [race, cls] = key.split('||')
      if (mode === 'race' && race === selected) {
        entries.push({ name: cls, count, color: CLASS_COLORS[cls] || '#6b7280', sub: null })
      } else if (mode === 'class' && cls === selected) {
        const raceData = raceMap.get(race)
        entries.push({ name: race, count, color: FACTION_COLORS[raceData?.faction] || '#6b7280', sub: raceData?.faction })
      }
    }

    const sorted = entries.sort((a, b) => b.count - a.count)
    const total = sorted.reduce((s, e) => s + e.count, 0)

    return {
      primaryList,
      breakdown: sorted.map(e => ({ ...e, pct: total > 0 ? (e.count / total) * 100 : 0 })),
    }
  }, [data, mode, selected])

  const maxPct = breakdown[0]?.pct || 1

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: pick panel */}
      <div>
        <div className="flex gap-2 mb-3">
          {[
            { value: 'race',  label: 'Pick Race' },
            { value: 'class', label: 'Pick Class' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setMode(opt.value); setSelected(null) }}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                mode === opt.value
                  ? 'bg-yogg-purple text-white'
                  : 'bg-void-700/50 text-void-400 hover:text-void-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
          {primaryList.map(item => (
            <button
              key={item.name}
              onClick={() => setSelected(selected === item.name ? null : item.name)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selected === item.name
                  ? 'bg-yogg-tentacle/60 border border-yogg-purple/50 text-void-100'
                  : 'hover:bg-void-700/40 text-void-300'
              }`}
            >
              <span
                className="font-medium"
                style={mode === 'class' ? { color: CLASS_COLORS[item.name] } : {}}
              >
                {item.name}
              </span>
              <span className="text-void-500 text-xs tabular-nums">
                {item.count.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: breakdown */}
      <div>
        {selected ? (
          <>
            <h4 className="text-void-200 font-medium mb-3 text-sm">
              {mode === 'race' ? 'Classes' : 'Races'} for{' '}
              <span
                className="font-semibold"
                style={mode === 'class' ? { color: CLASS_COLORS[selected] } : {}}
              >
                {selected}
              </span>
            </h4>
            <div className="space-y-2">
              {breakdown.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="text-void-600 text-xs w-4 text-right">{i + 1}</span>
                  <span className="w-28 text-sm font-medium truncate" style={{ color: item.color }}>
                    {item.name}
                  </span>
                  <div className="flex-1 bg-void-800/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.pct / maxPct) * 100}%`,
                        backgroundColor: item.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="text-void-400 text-xs w-12 text-right tabular-nums">
                    {item.pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-void-600 text-sm italic">
            Select a {mode} to see the breakdown
          </div>
        )}
      </div>
    </div>
  )
}
