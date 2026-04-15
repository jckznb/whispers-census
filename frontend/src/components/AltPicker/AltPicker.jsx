/**
 * AltPicker — multi-step quiz that recommends race + class combos.
 *
 * Quiz flow:
 *   Step 0: Role capability  (multi-select: tank / healer — neither = any class)
 *   Step 1: Content          (pvp / pve / both)
 *   Step 2: Popularity       (meta / rare / any)
 *   Step 3: Faction          (alliance / horde / any)
 *   Step 4: Aesthetics       (multi-select vibes, optional)
 *   → Results
 *
 * Scoring runs client-side against the already-fetched demographics blob,
 * using race+class combo counts only (no spec data required).
 */
import { useState, useMemo } from 'react'
import { QuizStep }    from './QuizStep'
import { ResultsView } from './ResultsView'
import { AESTHETICS, scoreResults } from '../../utils/altPickerScoring'

const STEPS = [
  {
    id:       'role',
    question: 'What roles do you want available?',
    subtext:  'DPS is always an option — check anything extra you want your class to support',
    type:     'multi',
    optional: true,  // selecting nothing = any class
    options: [
      {
        value: 'tank',
        label: 'Can Tank',
        emoji: '🛡️',
        desc:  'Has at least one tank specialization',
      },
      {
        value: 'healer',
        label: 'Can Heal',
        emoji: '💚',
        desc:  'Has at least one healer specialization',
      },
    ],
  },
  {
    id:       'content',
    question: 'What content do you push?',
    subtext:  'Shapes which dataset we pull popularity from',
    type:     'single',
    options: [
      { value: 'pvp',  label: 'PvP',     emoji: '⚔️', desc: 'Arena, Rated BGs, Solo Shuffle' },
      { value: 'pve',  label: 'Mythic+', emoji: '🏔️', desc: 'Dungeon keys and beyond' },
      { value: 'both', label: 'Both',    emoji: '🎯', desc: 'Mix everything together' },
    ],
  },
  {
    id:       'popularity',
    question: 'How do you feel about the meta?',
    subtext:  'Affects how we weight popularity in the results',
    type:     'single',
    options: [
      { value: 'meta', label: 'Give me the meta',  emoji: '🔥', desc: 'Play what top players play' },
      { value: 'rare', label: "I'm a hipster",     emoji: '🦄', desc: 'Less common, more unique' },
      { value: 'any',  label: "Don't care",        emoji: '😐', desc: 'Just show me what fits' },
    ],
  },
  {
    id:       'faction',
    question: 'Horde or Alliance?',
    subtext:  'Filter results to your preferred faction',
    type:     'single',
    options: [
      { value: 'alliance', label: 'Alliance',      emoji: '🔵', desc: 'For the Alliance!' },
      { value: 'horde',    label: 'Horde',         emoji: '🔴', desc: "Lok'tar Ogar!" },
      { value: 'any',      label: 'No preference', emoji: '🌐', desc: 'All races welcome' },
    ],
  },
  {
    id:       'aesthetics',
    question: 'Pick your vibe',
    subtext:  'Select any aesthetics that appeal to you — or skip',
    type:     'multi',
    optional: true,
    options:  AESTHETICS.map(a => ({
      value: a.id,
      label: a.label,
      emoji: a.emoji,
      desc:  a.desc,
    })),
  },
]

const INITIAL_ANSWERS = {
  role:       [],    // empty array = any class
  content:    null,
  popularity: null,
  faction:    null,
  aesthetics: [],
}

function isStepComplete(step, answers) {
  // Multi-select steps are always advanceable (zero selections = "any")
  if (step.type === 'multi') return true
  return answers[step.id] !== null && answers[step.id] !== undefined
}

export function AltPicker({ blob }) {
  const [stepIndex,   setStepIndex]   = useState(0)
  const [answers,     setAnswers]     = useState(INITIAL_ANSWERS)
  const [showResults, setShowResults] = useState(false)

  const currentStep = STEPS[stepIndex]

  const handleChange = (value) => {
    setAnswers(prev => ({ ...prev, [currentStep.id]: value }))
  }

  const advance = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(s => s + 1)
    } else {
      setShowResults(true)
    }
  }

  const handleSkip = () => advance()

  const canAdvance = isStepComplete(currentStep, answers)

  const restart = () => {
    setStepIndex(0)
    setAnswers(INITIAL_ANSWERS)
    setShowResults(false)
  }

  const { results, warning } = useMemo(() => {
    if (!showResults || !blob) return { results: [], warning: null }
    return scoreResults(blob, answers)
  }, [showResults, blob, answers])

  // No blob data yet
  if (!blob) {
    return (
      <div className="py-12 text-center text-void-500">
        <p className="text-sm">Waiting for census data to load…</p>
      </div>
    )
  }

  // Need at least combo-level data to function
  const hasAnyData = !!(blob.pvp?.combos?.length || blob.pve?.combos?.length)
  if (!hasAnyData) {
    return (
      <div className="py-12 text-center text-void-500 space-y-2">
        <p className="text-sm">No census data available yet.</p>
        <p className="text-xs">Run a PvP or M+ crawl first.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {showResults ? (
        <ResultsView
          results={results}
          answers={answers}
          warning={warning}
          onRestart={restart}
        />
      ) : (
        <div className="space-y-6">
          <QuizStep
            key={currentStep.id}
            question={currentStep.question}
            subtext={currentStep.subtext}
            type={currentStep.type}
            options={currentStep.options}
            selected={answers[currentStep.id]}
            onChange={handleChange}
            optional={currentStep.optional}
            onSkip={handleSkip}
            stepIndex={stepIndex}
            totalSteps={STEPS.length}
          />

          {/* Next / Finish button */}
          <div className="flex justify-end">
            <button
              onClick={advance}
              disabled={!canAdvance}
              className={`
                px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-yogg-eye focus:ring-offset-2 focus:ring-offset-void-900
                ${canAdvance
                  ? 'bg-yogg-purple hover:bg-void-400 text-white shadow-[0_0_12px_rgba(155,76,196,0.3)]'
                  : 'bg-void-700/40 text-void-600 cursor-not-allowed'
                }
              `}
            >
              {stepIndex === STEPS.length - 1 ? 'Show results →' : 'Next →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
