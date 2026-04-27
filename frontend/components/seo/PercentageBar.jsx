import Link from 'next/link'

/**
 * A single labelled horizontal percentage bar row.
 *
 * @param {string}  label       — display name
 * @param {number}  percentage  — 0-100
 * @param {string}  [href]      — if provided, wraps the row in a Link
 * @param {string}  [color]     — fill color (CSS color string)
 * @param {number}  [rank]      — optional rank number shown on the left
 * @param {number}  [maxPct]    — scale bar width relative to this value (default = percentage)
 */
export function PercentageBar({ label, percentage, href, color = '#9b4cc4', rank, maxPct }) {
  const barWidth = maxPct ? Math.min((percentage / maxPct) * 100, 100) : Math.min(percentage, 100)

  const inner = (
    <div className="flex items-center gap-3 group py-0.5">
      {rank != null && (
        <span className="w-5 text-right text-xs text-void-600 shrink-0 tabular-nums">{rank}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <span className={`text-sm truncate ${
            href ? 'text-void-200 group-hover:text-yogg-eye transition-colors' : 'text-void-200'
          }`}>
            {label}
          </span>
          <span className="text-sm font-mono text-void-400 shrink-0 tabular-nums">
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 bg-void-800/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${barWidth}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block rounded hover:bg-void-700/20 transition-colors px-1 -mx-1">
        {inner}
      </Link>
    )
  }
  return <div className="px-1">{inner}</div>
}
