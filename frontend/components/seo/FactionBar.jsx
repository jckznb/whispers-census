const ALLIANCE_COLOR = '#1a6eb5'
const HORDE_COLOR    = '#8c1c1c'

/**
 * A split bar showing Alliance vs Horde percentages.
 *
 * @param {number} alliance — decimal 0-1 (e.g. 0.47)
 * @param {number} horde    — decimal 0-1 (e.g. 0.53)
 */
export function FactionBar({ alliance, horde }) {
  const aPct = Math.round(alliance * 100)
  const hPct = Math.round(horde * 100)

  return (
    <div className="space-y-2.5">
      <div className="flex h-9 rounded-lg overflow-hidden border border-void-700/40 text-xs font-semibold">
        <div
          className="flex items-center justify-center text-white/90 transition-all duration-500"
          style={{ width: `${aPct}%`, backgroundColor: ALLIANCE_COLOR }}
        >
          {aPct >= 12 && `${aPct}%`}
        </div>
        <div
          className="flex items-center justify-center text-white/90 transition-all duration-500"
          style={{ width: `${hPct}%`, backgroundColor: HORDE_COLOR }}
        >
          {hPct >= 12 && `${hPct}%`}
        </div>
      </div>
      <div className="flex justify-between text-sm text-void-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ALLIANCE_COLOR }} />
          Alliance &nbsp;<strong className="text-void-200 font-mono">{aPct}%</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <strong className="text-void-200 font-mono">{hPct}%</strong>&nbsp; Horde
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: HORDE_COLOR }} />
        </span>
      </div>
    </div>
  )
}
