/**
 * ResultsView — shows top alt recommendations + restart CTA.
 *
 * Props:
 *   results   Array of scored result objects
 *   answers   Quiz answers object (for summary display)
 *   onRestart () => void
 */
import { ResultCard } from './ResultCard'

const ROLE_LABELS = { tank: 'Tank', healer: 'Healer', dps: 'DPS', any: 'Any role' }
const CONTENT_LABELS = { pvp: 'PvP', pve: 'Mythic+', both: 'PvP & M+' }
const POP_LABELS = { meta: 'Meta-focused', rare: 'Unique picks', any: 'Any popularity' }
const FACTION_LABELS = { alliance: 'Alliance', horde: 'Horde', any: 'Either faction' }

function AnswerPill({ label }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-void-700/60 border border-void-600/40 text-void-300">
      {label}
    </span>
  )
}

export function ResultsView({ results, answers, onRestart }) {
  const summaryPills = [
    ROLE_LABELS[answers.role],
    CONTENT_LABELS[answers.content],
    POP_LABELS[answers.popularity],
    FACTION_LABELS[answers.faction],
  ].filter(Boolean)

  const hasResults = results && results.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-display text-2xl font-semibold text-void-50 glow-eye mb-2">
          {hasResults ? 'The whispers have spoken' : 'No matches found'}
        </h3>
        {hasResults ? (
          <p className="text-void-400 text-sm">
            {results.length} alt{results.length !== 1 ? 's' : ''} recommended based on your answers
          </p>
        ) : (
          <p className="text-void-400 text-sm">
            Try relaxing your filters — the combination you selected has no data yet.
          </p>
        )}
        {/* Answer summary pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {summaryPills.map(p => <AnswerPill key={p} label={p} />)}
          {(answers.aesthetics || []).map(a => (
            <AnswerPill key={a} label={a.replace(/_/g, ' ')} />
          ))}
        </div>
      </div>

      {/* Result cards */}
      {hasResults && (
        <div className="space-y-3">
          {results.map((result, i) => (
            <ResultCard key={`${result.race}|${result.spec}`} result={result} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Note about data */}
      {hasResults && (
        <p className="text-void-600 text-xs">
          Popularity % is relative to the selected content context. Results from{' '}
          {CONTENT_LABELS[answers.content]} leaderboard data.
        </p>
      )}

      {/* Restart */}
      <div className="flex justify-center pt-2">
        <button onClick={onRestart} className="btn-ghost text-sm">
          ← Start over
        </button>
      </div>
    </div>
  )
}
