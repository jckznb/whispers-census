'use client'

import { useRawBlob } from '@/hooks/useDemographics'
import { ClassDonut } from '@/components/ClassDonut'
import { SpecRankings } from '@/components/SpecRankings'

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

export function PvpPageClient() {
  const { blob, loading, error } = useRawBlob()

  if (loading) return <LoadingOverlay />
  if (error) return (
    <div className="card p-4 text-red-400 text-sm">Failed to load data: {error.message}</div>
  )

  const ctx   = blob?.pvp
  const specs = ctx?.specs ?? []

  const totalChars = (ctx?.combos ?? []).reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Hero */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-void-100 tracking-wide mb-2">
          PvP Demographics
        </h1>
        <p className="text-void-400 text-sm max-w-xl">
          Spec and role breakdown from{' '}
          {totalChars > 0 ? <strong className="text-void-300">{totalChars.toLocaleString()}</strong> : 'US'}
          {' '}characters tracked on rated PvP leaderboards.
          {blob?.updated && (
            <span className="text-void-600 ml-2">Updated {blob.updated}</span>
          )}
        </p>
      </div>

      {/* Class distribution */}
      <section className="card p-6">
        <h2 className="section-title mb-5">Class Distribution</h2>
        <ClassDonut specs={specs} />
      </section>

      {/* Spec rankings */}
      <section className="card p-6">
        <h2 className="section-title mb-1">Spec Popularity</h2>
        <p className="text-void-500 text-xs mb-5">
          Filter by role to see how each spec ranks within tanks, healers, or DPS.
        </p>
        <SpecRankings specs={specs} />
      </section>

    </div>
  )
}
