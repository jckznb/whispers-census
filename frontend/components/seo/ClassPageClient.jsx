'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContextToggle } from '@/components/seo/ContextToggle'
import { PercentageBar } from '@/components/seo/PercentageBar'
import { FactionBar } from '@/components/seo/FactionBar'
import { FACTION_COLORS } from '@/utils/constants'
import { pluralRace, pluralClass } from '@/utils/pluralize'

// Alliance race slugs — used to colour bars blue vs red
const ALLIANCE_RACE_SLUGS = new Set([
  'human', 'dwarf', 'night-elf', 'gnome', 'draenei', 'worgen',
  'void-elf', 'lightforged-draenei', 'dark-iron-dwarf', 'kul-tiran', 'mechagnome',
])

function raceBarColor(raceSlug) {
  if (raceSlug.endsWith('-alliance'))   return FACTION_COLORS.alliance
  if (raceSlug.endsWith('-horde'))      return FACTION_COLORS.horde
  if (ALLIANCE_RACE_SLUGS.has(raceSlug)) return FACTION_COLORS.alliance
  return FACTION_COLORS.horde
}

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

export function ClassPageClient({ data, icon }) {
  const available = {
    general: data.general != null,
    pvp:     data.pvp     != null,
    mythic:  data.mythic  != null,
  }
  const defaultCtx = available.general ? 'general' : available.pvp ? 'pvp' : 'mythic'
  const [ctx, setCtx] = useState(defaultCtx)

  const ctxData     = data[ctx]
  const classPluralName = pluralClass(data.name)
  const maxRacePct  = ctxData?.races?.[0]?.percentage ?? 100

  const topRace    = ctxData?.races?.[0]
  const bottomRace = ctxData?.races?.[ctxData?.races?.length - 1]
  const relatedRaces = ctxData?.races?.slice(0, 3) ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Breadcrumb */}
      <nav className="text-sm text-void-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-void-300 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/#browse-classes" className="hover:text-void-300 transition-colors">Classes</Link>
        <span>/</span>
        <span className="text-void-200">{data.name}</span>
      </nav>

      {/* Hero */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          {icon && (
            <img src={icon} alt={data.name} width={56} height={56}
                 className="rounded-lg shrink-0 ring-1 ring-void-600/40" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-void-50 glow-eye tracking-wide leading-snug">
              {data.name}{' '}Population &amp; Demographics
            </h1>
            <p className="text-sm text-void-500 mt-1">
              Data updated{' '}{new Date(data.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Evoker note */}
        {data.slug === 'evoker' && (
          <p className="mt-4 text-sm text-void-400 bg-void-800/60 rounded-lg px-4 py-2.5 border border-void-600/30">
            Currently, only Dracthyr can play as Evoker. This page will update automatically if Blizzard opens the class to additional races.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {topRace && (
            <StatCard
              label="Most played race"
              value={topRace.name}
              sub={`${topRace.percentage.toFixed(1)}% of ${classPluralName}`}
            />
          )}
          {bottomRace && bottomRace.slug !== topRace?.slug && (
            <StatCard
              label="Least played race"
              value={bottomRace.name}
              sub={`${bottomRace.percentage.toFixed(1)}% of ${classPluralName}`}
            />
          )}
        </div>

        <div className="mt-4">
          <ContextToggle active={ctx} onChange={setCtx} available={available} />
        </div>
      </div>

      {/* Race breakdown */}
      {ctxData ? (
        <Section title="Race Popularity">
          <div className="space-y-2">
            {ctxData.races.map((race, i) => (
              <PercentageBar
                key={race.slug}
                rank={i + 1}
                label={race.name}
                percentage={race.percentage}
                maxPct={maxRacePct}
                color={raceBarColor(race.slug)}
                href={`/${race.slug}`}
              />
            ))}
          </div>
        </Section>
      ) : (
        <Section title="Race Popularity">
          <p className="text-void-500 text-sm">No data available for this context.</p>
        </Section>
      )}

      {/* Faction split */}
      {ctxData?.factionSplit && (
        <Section title="Faction Split">
          <FactionBar
            alliance={ctxData.factionSplit.alliance}
            horde={ctxData.factionSplit.horde}
          />
        </Section>
      )}

      {/* Spec distribution */}
      {ctxData?.specs?.length > 0 && (
        <Section title="Spec Distribution">
          <div className="space-y-2">
            {ctxData.specs.map((spec, i) => (
              <PercentageBar
                key={spec.name}
                rank={i + 1}
                label={spec.name}
                percentage={spec.percentage}
                color="#9b4cc4"
              />
            ))}
          </div>
          {ctx === 'general' && (
            <p className="text-xs text-void-600 mt-2">
              Spec data is only available for characters who appeared on a PvP or Mythic+ leaderboard.
              General population spec coverage is partial.
            </p>
          )}
        </Section>
      )}

      {/* Road less traveled */}
      {ctxData?.races?.length >= 3 && (
        <Section title="The Road Less Traveled">
          <p className="text-sm text-void-400 mb-3">
            The rarest{' '}{data.name}{' '}choices — viable, but you&apos;ll stand out.
          </p>
          <div className="space-y-3">
            {[...ctxData.races].reverse().slice(0, 3).map(race => (
              <div key={race.slug} className="flex items-center justify-between gap-3">
                <Link href={`/${race.slug}`}
                      className="text-sm text-void-300 hover:text-yogg-eye transition-colors">
                  {race.name}
                </Link>
                <span className="text-sm font-mono text-void-500">
                  only {race.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Related */}
      {relatedRaces.length > 0 && (
        <section>
          <h2 className="section-title mb-3">Popular{' '}{data.name}{' '}Races</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {relatedRaces.map(race => (
              <Link key={race.slug} href={`/${race.slug}`}
                    className="card px-4 py-3 hover:border-yogg-purple/50 transition-colors group">
                <p className="text-sm font-medium text-void-200 group-hover:text-void-50 transition-colors truncate">
                  {race.name}
                </p>
                <p className="text-xs text-void-500 mt-0.5 font-mono">
                  {race.percentage.toFixed(1)}%
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
