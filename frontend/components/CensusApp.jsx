'use client'

import { useState } from 'react'
import { ContextSelector } from '@/components/ContextSelector'
import { PopularityBars } from '@/components/PopularityBars'
import { RaceClassHeatmap } from '@/components/RaceClassHeatmap'
import { ComboExplorer } from '@/components/ComboExplorer'
import { AltPicker } from '@/components/AltPicker/AltPicker'
import { useDemographics, useRawBlob } from '@/hooks/useDemographics'
import { ComboHighlights } from '@/components/ComboHighlights'

function LoadingOverlay() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-yogg-purple/20 animate-ping absolute inset-0" />
          <div className="w-12 h-12 rounded-full bg-yogg-void border-2 border-yogg-purple/50 flex items-center justify-center relative">
            <div className="w-4 h-4 rounded-full bg-yogg-eye animate-pulse" />
          </div>
        </div>
        <span className="text-void-400 text-sm">The whispers are gathering data…</span>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="card p-5">
      <h2 className="section-title mb-4">{title}</h2>
      {children}
    </section>
  )
}

const TABS = [
  { id: 'census',    label: 'Census'     },
  { id: 'altpicker', label: 'Alt Picker' },
]

export function CensusApp({ children }) {
  const [tab,      setTab]      = useState('census')
  const [context,  setContext]  = useState('general')
  const [barsView, setBarsView] = useState('class')

  const { data, specData, specCombos, loading, error, snapshotDate } = useDemographics(context)
  const { blob, loading: blobLoading } = useRawBlob()

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Tab switcher + snapshot date */}
        <div className="flex items-center justify-between gap-4">
          <nav className="flex gap-1 bg-void-800/60 border border-void-600/30 rounded-lg p-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-yogg-purple/80 text-white'
                    : 'text-void-400 hover:text-void-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          {snapshotDate && (
            <span className="text-void-500 text-xs hidden sm:block">
              Snapshot: {snapshotDate}
            </span>
          )}
        </div>

        {/* ── Alt Picker tab ─────────────────────────────────────────── */}
        {tab === 'altpicker' && (
          <div className="card p-6">
            <div className="mb-6">
              <h2 className="section-title mb-1">Alt Picker</h2>
              <p className="text-void-400 text-sm">
                Answer a few questions and we&apos;ll recommend race + class combos
                based on real census data.
              </p>
            </div>
            {blobLoading ? (
              <LoadingOverlay />
            ) : (
              <AltPicker blob={blob} />
            )}
          </div>
        )}

        {/* ── Census tab ─────────────────────────────────────────────── */}
        {tab === 'census' && (
          <>
            <ComboHighlights blob={blob} />

            <div className="card p-4">
              <ContextSelector context={context} onChange={setContext} />
            </div>

            {error && (
              <div className="card p-4 border-red-900/40 bg-red-900/10 text-red-400 text-sm">
                Failed to load data: {error.message}
              </div>
            )}

            {loading ? (
              <LoadingOverlay />
            ) : data.length === 0 ? (
              <div className="card p-8 text-center text-void-500">
                <p className="text-lg font-display mb-2">No data yet</p>
                <p className="text-sm">
                  Run the crawler first:{' '}
                  <code className="bg-void-800 px-2 py-0.5 rounded text-void-300">
                    python -m scripts.run_crawl --phase pvp --region us
                  </code>
                </p>
              </div>
            ) : (
              <>
                <Section title="Race × Class Heatmap">
                  <p className="text-void-500 text-xs mb-4">
                    Color intensity = relative popularity. Click a cell for details. Gray = invalid combo.
                  </p>
                  <RaceClassHeatmap data={data} specCombos={specCombos} />
                </Section>

                <Section title="Popularity Rankings">
                  <div className="flex gap-2 mb-4">
                    {[
                      { value: 'class', label: 'By Class' },
                      { value: 'race',  label: 'By Race' },
                      { value: 'spec',  label: 'By Spec', disabled: specData.length === 0 },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => !opt.disabled && setBarsView(opt.value)}
                        disabled={opt.disabled}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          barsView === opt.value
                            ? 'bg-void-600/60 text-void-100'
                            : opt.disabled
                              ? 'text-void-600 cursor-not-allowed'
                              : 'text-void-500 hover:text-void-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <PopularityBars
                    data={barsView === 'spec' ? specData : data}
                    groupBy={barsView}
                  />
                </Section>

                <Section title="Combo Explorer">
                  <p className="text-void-500 text-xs mb-4">
                    Pick a race or class to see what else people pair it with.
                  </p>
                  <ComboExplorer data={data} />
                </Section>
              </>
            )}
          </>
        )}
      </main>

      {/* Extra content slot (browse grids from page.js) */}
      {children}
    </>
  )
}
