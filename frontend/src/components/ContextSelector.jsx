import { CONTEXTS } from '../utils/constants'

export function ContextSelector({ context, onChange }) {
  const phase1 = CONTEXTS.filter(c => c.phase === 1)
  const future = CONTEXTS.filter(c => c.phase > 1)

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {phase1.map(ctx => (
        <button
          key={ctx.id}
          onClick={() => onChange(ctx.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
            context === ctx.id
              ? 'bg-yogg-purple text-white shadow-lg shadow-yogg-purple/30'
              : 'bg-void-700/50 text-void-300 hover:bg-void-600/50 hover:text-void-100'
          }`}
        >
          {ctx.label}
        </button>
      ))}
      <div className="w-px h-5 bg-void-600/50 mx-1" />
      {future.map(ctx => (
        <button
          key={ctx.id}
          disabled
          title="Coming in a future phase"
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-void-800/30 text-void-600 cursor-not-allowed"
        >
          {ctx.label}
          <span className="ml-1.5 text-xs opacity-60">soon</span>
        </button>
      ))}
    </div>
  )
}
