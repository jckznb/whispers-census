'use client'

/**
 * QuizStep — renders a single quiz question with its options.
 *
 * Props:
 *   question    string   — the main question text
 *   subtext     string   — secondary context line
 *   type        'single' | 'multi'
 *   options     [{value, label, emoji, desc}]
 *   selected    string | string[]  — current answer(s)
 *   onChange    (value) => void    — called with new value/toggle
 *   optional    bool     — show "Skip" button
 *   onSkip      () => void
 *   stepIndex   number
 *   totalSteps  number
 */
export function QuizStep({
  question,
  subtext,
  type,
  options,
  selected,
  onChange,
  optional,
  onSkip,
  stepIndex,
  totalSteps,
}) {
  const isSelected = (value) => {
    if (type === 'multi') return Array.isArray(selected) && selected.includes(value)
    return selected === value
  }

  const handleClick = (value) => {
    if (type === 'multi') {
      const current = Array.isArray(selected) ? selected : []
      onChange(
        current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value]
      )
    } else {
      onChange(value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i < stepIndex
                ? 'bg-yogg-purple w-6'
                : i === stepIndex
                  ? 'bg-yogg-eye w-8'
                  : 'bg-void-700 w-4'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div>
        <h3 className="font-display text-2xl font-semibold text-void-50 glow-eye mb-1">
          {question}
        </h3>
        {subtext && (
          <p className="text-void-400 text-sm">{subtext}</p>
        )}
      </div>

      {/* Options grid */}
      <div className={`grid gap-3 ${
        options.length <= 3
          ? 'grid-cols-1 sm:grid-cols-3'
          : options.length === 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      }`}>
        {options.map(opt => {
          const active = isSelected(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => handleClick(opt.value)}
              className={`
                group relative p-4 rounded-xl border text-left transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-yogg-eye focus:ring-offset-2 focus:ring-offset-void-900
                ${active
                  ? 'bg-yogg-purple/20 border-yogg-purple text-void-50 shadow-[0_0_12px_rgba(155,76,196,0.3)]'
                  : 'bg-void-800/40 border-void-600/30 text-void-300 hover:bg-void-700/40 hover:border-void-500/50 hover:text-void-100'
                }
              `}
            >
              {type === 'multi' && (
                <div className={`absolute top-3 right-3 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  active
                    ? 'bg-yogg-purple border-yogg-purple'
                    : 'border-void-500 group-hover:border-void-300'
                }`}>
                  {active && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5L4 7.5 8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              )}
              <div className="text-2xl mb-2">{opt.emoji}</div>
              <div className="font-semibold text-sm mb-0.5">{opt.label}</div>
              {opt.desc && (
                <div className={`text-xs transition-colors ${active ? 'text-void-300' : 'text-void-500 group-hover:text-void-400'}`}>
                  {opt.desc}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Skip button for optional steps */}
      {optional && (
        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-void-500 hover:text-void-300 text-sm transition-colors"
          >
            Skip this step →
          </button>
        </div>
      )}
    </div>
  )
}
