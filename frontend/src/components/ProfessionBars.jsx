import { PROFESSION_TYPE_COLORS } from '../utils/constants'

/**
 * Horizontal bar chart for profession distribution.
 *
 * data: [{name, type, count, pct}] — from blob ctx.professions
 *
 * Bars are colored by profession type (crafting/gathering/secondary).
 * pct values come from the RPC and represent % of players in this context
 * with that profession equipped — NOT % of total profession slots.
 */
export function ProfessionBars({ data = [] }) {
  if (!data.length) {
    return (
      <div className="text-void-500 text-sm text-center py-8">
        No profession data yet — will populate after next crawl
      </div>
    )
  }

  const maxPct = data[0]?.pct || 1

  // Type labels for the legend
  const typeOrder = ['crafting', 'gathering', 'secondary']

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {typeOrder.map(type => (
          <span key={type} className="flex items-center gap-1.5 text-xs text-void-400">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: PROFESSION_TYPE_COLORS[type] }}
            />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
      </div>

      {/* Bars */}
      <div className="space-y-2">
        {data.map((prof, i) => {
          const color = PROFESSION_TYPE_COLORS[prof.type] || '#6b7280'
          return (
            <div key={prof.name} className="flex items-center gap-3">
              {/* Rank */}
              <span className="text-void-500 text-xs w-5 text-right shrink-0">{i + 1}</span>

              {/* Label */}
              <div className="w-36 shrink-0">
                <span className="text-sm font-medium truncate block" style={{ color }}>
                  {prof.name}
                </span>
                <span className="text-xs text-void-500 truncate block capitalize">
                  {prof.type}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 bg-void-800/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(prof.pct / maxPct) * 100}%`,
                    backgroundColor: color,
                    opacity: 0.85,
                  }}
                />
              </div>

              {/* Percentage — of all players in this context */}
              <span className="text-void-300 text-xs w-12 text-right shrink-0 tabular-nums">
                {prof.pct.toFixed(1)}%
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-void-600 text-xs">
        % of players in this dataset who have that primary profession equipped.
        Most players have 2 primary professions, so totals exceed 100%.
      </p>
    </div>
  )
}
