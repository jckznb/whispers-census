'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContextToggle } from '@/components/seo/ContextToggle'
import { PercentageBar } from '@/components/seo/PercentageBar'
import { FactionBar } from '@/components/seo/FactionBar'
import { CLASS_COLORS } from '@/utils/constants'
import { pluralClass, pluralRace } from '@/utils/pluralize'

const FACTION_COLOR = { alliance: '#1a6eb5', horde: '#8c1c1c', neutral: '#6b7280' }

function StatCard({ label, value, sub }) {
  return (
    <div className="card px-4 py-3 flex flex-col gap-0.5">
      <p className="text-xs text-void-500 uppercase tracking-wider">{label}</p>
      <p className="font-display text-lg font-semibold text-void-100 leading-tight">{value}</p>
      {sub && <p className="text-sm text-void-400">{sub}</p>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="card p-5 space-y-4">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  )
}

// ── Disambiguation page ────────────────────────────────────────────────────────

function DisambiguationPage({ data }) {
  const { name, variants, factionChoice, aggregate, lastUpdated } = data
  const [ctx, setCtx] = useState('general')

  const available = {
    general: aggregate?.general != null,
    pvp:     aggregate?.pvp     != null,
    mythic:  aggregate?.mythic  != null,
  }

  const ctxData = aggregate?.[ctx]
  const maxPct  = ctxData?.classes?.[0]?.percentage ?? 100

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      <nav className="text-sm text-void-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-void-300 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/general#browse-races" className="hover:text-void-300 transition-colors">Races</Link>
        <span>/</span>
        <span className="text-void-200">{name}</span>
      </nav>

      <div className="card p-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-void-50 glow-eye tracking-wide">
          {name}
        </h1>
        <p className="text-sm text-void-400 mt-2 max-w-prose">
          {name} is a neutral race — players choose their faction at character creation.
          Pick a faction below to see that version&apos;s class distribution.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {variants.map(v => {
            const faction = v.endsWith('-horde') ? 'horde' : 'alliance'
            const label   = faction === 'horde' ? `Horde ${name}` : `Alliance ${name}`
            const pct     = factionChoice ? Math.round((factionChoice[faction] ?? 0) * 100) : null
            return (
              <Link key={v} href={`/${v}`}
                    className="card px-4 py-3 hover:border-yogg-purple/50 transition-colors group flex flex-col gap-1">
                <span className="text-sm font-semibold text-void-200 group-hover:text-void-50">
                  {label} →
                </span>
                {pct != null && (
                  <span className="text-xs font-mono text-void-500">{pct}% of all {pluralRace(name)}</span>
                )}
              </Link>
            )
          })}
        </div>

        {factionChoice && (
          <div className="mt-5">
            <p className="text-xs text-void-500 uppercase tracking-wider mb-2">Faction choice</p>
            <FactionBar alliance={factionChoice.alliance} horde={factionChoice.horde} />
          </div>
        )}

        <p className="text-xs text-void-600 mt-3">
          Updated{' '}{new Date(lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Aggregate class breakdown */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="section-title">Class Popularity (All {pluralRace(name)})</h2>
          <ContextToggle active={ctx} onChange={setCtx} available={available} />
        </div>
        {ctxData ? (
          <div className="space-y-2">
            {ctxData.classes.map((cls, i) => (
              <PercentageBar
                key={cls.slug}
                rank={i + 1}
                label={cls.name}
                percentage={cls.percentage}
                maxPct={maxPct}
                color={CLASS_COLORS[cls.name] || '#9b4cc4'}
                href={`/${cls.slug}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-void-500 text-sm">No data available.</p>
        )}
      </div>

    </div>
  )
}

// ── Standard race page ─────────────────────────────────────────────────────────

export function RacePageClient({ data }) {
  if (data.isDisambiguation) return <DisambiguationPage data={data} />

  const available = {
    general: data.general != null,
    pvp:     data.pvp     != null,
    mythic:  data.mythic  != null,
  }
  const defaultCtx = available.general ? 'general' : available.pvp ? 'pvp' : 'mythic'
  const [ctx, setCtx] = useState(defaultCtx)

  const ctxData  = data[ctx]
  const maxPct   = ctxData?.classes?.[0]?.percentage ?? 100
  const racePlural = pluralRace(data.name)

  const topClass    = ctxData?.classes?.[0]
  const bottomClass = ctxData?.classes?.[ctxData?.classes?.length - 1]
  const relatedCls  = ctxData?.classes?.slice(0, 3) ?? []

  const faction       = data.faction
  const factionColor  = FACTION_COLOR[faction] || FACTION_COLOR.neutral
  const isNeutral     = data.isNeutralFactionVariant

  // Breadcrumb entries
  const breadcrumbs = isNeutral
    ? [
        { label: 'Home',  href: '/' },
        { label: 'Races', href: '/general#browse-races' },
        { label: data.name.split('(')[0].trim(), href: `/${data.baseRace}` },
        { label: data.name },
      ]
    : [
        { label: 'Home',  href: '/' },
        { label: 'Races', href: '/general#browse-races' },
        { label: data.name },
      ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Breadcrumb */}
      <nav className="text-sm text-void-500 flex items-center gap-1.5 flex-wrap">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span>/</span>}
            {crumb.href
              ? <Link href={crumb.href} className="hover:text-void-300 transition-colors">{crumb.label}</Link>
              : <span className="text-void-200">{crumb.label}</span>}
          </span>
        ))}
      </nav>

      {/* Hero */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-void-50 glow-eye tracking-wide">
                {data.name}
              </h1>
              {faction && faction !== 'neutral' && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full text-white capitalize"
                      style={{ backgroundColor: factionColor }}>
                  {faction}
                </span>
              )}
            </div>

            {isNeutral && (
              <div className="flex gap-3 text-sm text-void-400 mt-1 flex-wrap">
                {data.baseRace && (
                  <Link href={`/${data.baseRace}`} className="hover:text-void-200 transition-colors">
                    ← {data.name.split('(')[0].trim()} overview
                  </Link>
                )}
                {data.faction === 'horde' && (
                  <Link href={`/${data.baseRace}-alliance`} className="hover:text-void-200 transition-colors">
                    Alliance variant →
                  </Link>
                )}
                {data.faction === 'alliance' && (
                  <Link href={`/${data.baseRace}-horde`} className="hover:text-void-200 transition-colors">
                    Horde variant →
                  </Link>
                )}
              </div>
            )}

            <p className="text-sm text-void-500 mt-2">
              Updated{' '}{new Date(data.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {topClass && (
            <StatCard
              label="Most played class"
              value={topClass.name}
              sub={`${topClass.percentage.toFixed(1)}% of ${racePlural}`}
            />
          )}
          {bottomClass && bottomClass.slug !== topClass?.slug && (
            <StatCard
              label="Least played class"
              value={bottomClass.name}
              sub={`${bottomClass.percentage.toFixed(1)}% of ${racePlural}`}
            />
          )}
        </div>

        <div className="mt-4">
          <ContextToggle active={ctx} onChange={setCtx} available={available} />
        </div>
      </div>

      {/* Class breakdown */}
      {ctxData ? (
        <Section title="Class Popularity">
          <div className="space-y-2">
            {ctxData.classes.map((cls, i) => (
              <PercentageBar
                key={cls.slug}
                rank={i + 1}
                label={cls.name}
                percentage={cls.percentage}
                maxPct={maxPct}
                color={CLASS_COLORS[cls.name] || '#9b4cc4'}
                href={`/${cls.slug}`}
              />
            ))}
          </div>
        </Section>
      ) : (
        <Section title="Class Popularity">
          <p className="text-void-500 text-sm">No data available for this context.</p>
        </Section>
      )}

      {/* Road less traveled */}
      {ctxData?.classes?.length >= 3 && (
        <Section title="The Road Less Traveled">
          <p className="text-sm text-void-400 mb-3">
            Rarest class choices for {racePlural} — unusual, but they exist.
          </p>
          <div className="space-y-3">
            {[...ctxData.classes].reverse().slice(0, 3).map(cls => (
              <div key={cls.slug} className="flex items-center justify-between gap-3">
                <Link href={`/${cls.slug}`}
                      className="text-sm text-void-300 hover:text-yogg-eye transition-colors">
                  {cls.name}
                </Link>
                <span className="text-sm font-mono text-void-500">
                  only {cls.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Related */}
      {relatedCls.length > 0 && (
        <section>
          <h2 className="section-title mb-3">Popular{' '}{data.name}{' '}Classes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {relatedCls.map(cls => (
              <Link key={cls.slug} href={`/${cls.slug}`}
                    className="card px-4 py-3 hover:border-yogg-purple/50 transition-colors group">
                <p className="text-sm font-medium text-void-200 group-hover:text-void-50 transition-colors">
                  {cls.name}
                </p>
                <p className="text-xs text-void-500 mt-0.5 font-mono">
                  {cls.percentage.toFixed(1)}%
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
