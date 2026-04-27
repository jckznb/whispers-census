'use client'

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'pvp',     label: 'PvP' },
  { id: 'mythic',  label: 'Mythic+' },
]

/**
 * @param {string}   active     — currently selected context id
 * @param {Function} onChange   — called with new context id
 * @param {object}   available  — { general: bool, pvp: bool, mythic: bool }
 */
export function ContextToggle({ active, onChange, available = {} }) {
  return (
    <div className="flex gap-1 p-1 bg-void-900/60 rounded-lg border border-void-700/40">
      {TABS.map(({ id, label }) => {
        const enabled = available[id] !== false
        return (
          <button
            key={id}
            disabled={!enabled}
            onClick={() => enabled && onChange(id)}
            className={[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              active === id
                ? 'bg-yogg-purple text-white shadow-sm'
                : enabled
                  ? 'text-void-300 hover:text-void-100 hover:bg-void-700/50'
                  : 'text-void-600 cursor-not-allowed',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
