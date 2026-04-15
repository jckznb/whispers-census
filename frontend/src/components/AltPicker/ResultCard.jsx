/**
 * ResultCard — displays a single alt recommendation.
 *
 * Props:
 *   result  { race, faction, class, spec, role, pct, popularityLabel }
 *   rank    number (1–5)
 */
import { CLASS_COLORS, ROLE_COLORS, FACTION_COLORS } from '../../utils/constants'

const ROLE_LABELS = { tank: 'Tank', healer: 'Healer', dps: 'DPS' }
const FACTION_EMOJI = { alliance: '🔵', horde: '🔴', neutral: '⚪' }

const POPULARITY_STYLES = {
  'Meta pick':    'text-amber-400  bg-amber-400/10  border-amber-400/30',
  'Rare find':    'text-violet-300 bg-violet-400/10 border-violet-400/30',
  'Solid choice': 'text-teal-400   bg-teal-400/10   border-teal-400/30',
}

export function ResultCard({ result, rank }) {
  const { race, faction, class: cls, spec, role, pct, popularityLabel } = result
  const classColor  = CLASS_COLORS[cls]  || '#9b7dff'
  const roleColor   = ROLE_COLORS[role]  || ROLE_COLORS.dps
  const factionEmoji = FACTION_EMOJI[faction] || '⚪'
  const popStyle    = POPULARITY_STYLES[popularityLabel] || POPULARITY_STYLES['Solid choice']

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

      <div className="pl-3 pr-6 space-y-3">
        {/* Main identity */}
        <div>
          <div className="flex items-center gap-1.5 text-void-400 text-xs mb-1">
            <span>{factionEmoji}</span>
            <span>{faction === 'neutral' ? 'Neutral' : faction.charAt(0).toUpperCase() + faction.slice(1)}</span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-xl font-semibold text-void-50">
              {race}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span style={{ color: classColor }} className="font-semibold text-sm">
              {spec}
            </span>
            <span className="text-void-500 text-sm">{cls}</span>
          </div>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-2">
          {/* Role badge */}
          <span
            className="text-xs px-2 py-0.5 rounded border"
            style={{
              color: roleColor,
              backgroundColor: `${roleColor}18`,
              borderColor:     `${roleColor}40`,
            }}
          >
            {ROLE_LABELS[role] || 'DPS'}
          </span>

          {/* Popularity label */}
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
