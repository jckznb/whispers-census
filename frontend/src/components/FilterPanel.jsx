export function FilterPanel({ filters, onChange }) {
  const { region = 'all' } = filters

  return (
    <div className="flex flex-wrap gap-4 items-center text-sm">
      {/* Region */}
      <div className="flex items-center gap-2">
        <span className="text-void-400 font-medium">Region</span>
        <div className="flex rounded-lg overflow-hidden border border-void-600/30">
          {['all', 'us', 'eu'].map(r => (
            <button
              key={r}
              onClick={() => onChange({ ...filters, region: r })}
              className={`px-3 py-1 font-medium uppercase text-xs transition-colors duration-150 ${
                region === r
                  ? 'bg-yogg-purple text-white'
                  : 'bg-void-800/50 text-void-400 hover:text-void-200'
              }`}
            >
              {r === 'all' ? 'All' : r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
