'use client'

/**
 * ResultCard — displays a single alt recommendation (race + class).
 *
 * Props:
 *   result  { race, faction, class, pct, popularityLabel }
 *   rank    number (1–5)
 */
import { CLASS_COLORS, FACTION_COLORS } from '@/utils/constants'

const FACTION_LABEL = { alliance: 'Alliance', horde: 'Horde', neutral: 'Neutral' }
const FACTION_EMOJI  = { alliance: '🔵', horde: '🔴', neutral: '⚪' }

const POPULARITY_STYLES = {
  'Meta pick':    'text-amber-400  bg-amber-400/10  border-amber-400/30',
  'Rare find':    'text-violet-300 bg-violet-400/10 border-violet-400/30',
  'Solid choice': 'text-teal-400   bg-teal-400/10   border-teal-400/30',
}

export function ResultCard({ result, rank }) {
  const { race, faction, class: cls, pct, popularityLabel } = result
  const classColor   = CLASS_COLORS[cls]  || '#9b7dff'
  const factionEmoji = FACTION_EMOJI[faction]  || '⚪'
  const factionLabel = FACTION_LABEL[faction]  || ''
  const popStyle     = POPULARITY_STYLES[popularityLabel] || POPULARITY_STYLES['Solid choice']

  return (
    <div
      className={`relative card p-5 overflow-hidden transition-all duration-200 hover:scale-[1.01]
        ${rank === 1 ? 'ring-1 ring-yogg-purple/50 shadow-[0_0_20px_rgba(155,76,196,0.15)]' : ''}
      `}
    >
      {/* Colored left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: classColor }}
      />

      {/* Rank badge */}
      <div className="absolute top-3 right-3">
        <span className={`text-xs font-bold font-display px-2 py-0.5 rounded
          ${rank === 1 ? 'text-yogg-eye bg-yogg-purple/20' : 'text-void-500 bg-void-700/40'}
        `}>
          #{rank}
        </span>
      </div>

      <div className="pl-3 pr-8 space-y-3">
        {/* Faction line */}
        <div className="flex items-center gap-1.5 text-void-400 text-xs">
          <span>{factionEmoji}</span>
          <span>{factionLabel}</span>
        </div>

        {/* Race + Class */}
        <div>
          <div className="font-display text-xl font-semibold text-void-50">
            {race}
          </div>
          <div
            className="font-semibold text-sm mt-0.5"
            style={{ color: classColor }}
          >
            {cls}
          </div>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2 py-0.5 rounded border ${popStyle}`}>
            {popularityLabel}
          </span>
        </div>

        {/* Popularity bar */}
        <div>
          <div className="flex justify-between text-xs text-void-500 mb-1">
            <span>Popularity in dataset</span>
            <span className="text-void-300">{pct.toFixed(2)}%</span>
          </div>
          <div className="h-1.5 bg-void-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:           `${Math.min(pct * 4, 100)}%`,
                backgroundColor: classColor,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
