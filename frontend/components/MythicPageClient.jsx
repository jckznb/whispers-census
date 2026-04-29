'use client'

import { useRef, useState } from 'react'
import { useRawBlob } from '@/hooks/useDemographics'
import { ClassDonut } from '@/components/ClassDonut'
import { SpecRankings } from '@/components/SpecRankings'
import { MythicClassTemplate } from '@/components/share/MythicClassTemplate'
import { shareImage } from '@/utils/shareImage'

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

function ShareButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                 text-void-400 hover:text-void-200 hover:bg-void-700/40
                 transition-colors disabled:opacity-50 disabled:cursor-wait"
    >
      {loading ? (
        <>
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Generating…
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </>
      )}
    </button>
  )
}

export function MythicPageClient() {
  const { blob, loading, error } = useRawBlob()
  const templateRef  = useRef(null)
  const [sharing, setSharing] = useState(false)

  async function handleShareClass() {
    if (!templateRef.current) return
    setSharing(true)
    try {
      await shareImage(
        templateRef.current,
        'whisperscensus-mythic-classes',
        'Mythic+ Class Distribution — Whispers Census'
      )
    } finally {
      setSharing(false)
    }
  }

  if (loading) return <LoadingOverlay />
  if (error) return (
    <div className="card p-4 text-red-400 text-sm">Failed to load data: {error.message}</div>
  )

  const ctx        = blob?.pve
  const specs      = ctx?.specs ?? []
  const totalChars = (ctx?.combos ?? []).reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Hero */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-void-100 tracking-wide mb-2">
          Mythic+ Demographics
        </h1>
        <p className="text-void-400 text-sm max-w-xl">
          Spec and role breakdown from{' '}
          {totalChars > 0 ? <strong className="text-void-300">{totalChars.toLocaleString()}</strong> : 'US'}
          {' '}characters tracked in rated Mythic+ content.
          {blob?.updated && (
            <span className="text-void-600 ml-2">Updated {blob.updated}</span>
          )}
        </p>
      </div>

      {/* Class distribution */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Class Distribution</h2>
          <ShareButton onClick={handleShareClass} loading={sharing} />
        </div>
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

      {/* Off-screen share template */}
      <MythicClassTemplate
        ref={templateRef}
        specs={specs}
        total={totalChars}
        updatedDate={blob?.updated}
      />

    </div>
  )
}
