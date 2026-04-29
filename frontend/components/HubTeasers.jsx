'use client'

import Link from 'next/link'
import { useRawBlob } from '@/hooks/useDemographics'
import { CLASS_COLORS } from '@/utils/constants'

const ROLE_COLORS  = { tank: '#3b82f6', healer: '#10b981', damage: '#f59e0b' }
const ROLE_LABELS  = { tank: 'Tank', healer: 'Healer', damage: 'DPS' }

/* ── Mini bar row ─────────────────────────────────────────────────────── */
function MiniBar({ label, sublabel, pct, maxPct, color }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-xs text-void-200 truncate">{label}
          {sublabel && <span className="text-void-500 ml-1">{sublabel}</span>}
        </span>
        <span className="text-xs text-void-400 shrink-0">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1 bg-void-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(pct / maxPct) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

/* ── Role split inline bar ────────────────────────────────────────────── */
function RoleBar({ specs }) {
  const totals = { tank: 0, healer: 0, damage: 0 }
  ;(specs || []).forEach(s => {
    if (totals[s.role] !== undefined) totals[s.role] += s.count
  })
  const total = totals.tank + totals.healer + totals.damage
  if (total === 0) return null
  const pcts = Object.entries(totals).map(([role, count]) => ({
    role, pct: (count / total) * 100,
  }))

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {pcts.map(({ role, pct }) => (
          <div key={role} style={{ width: `${pct}%`, backgroundColor: ROLE_COLORS[role] }} />
        ))}
      </div>
      <div className="flex gap-4">
        {pcts.map(({ role, pct }) => (
          <div key={role} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ROLE_COLORS[role] }} />
            <span className="text-xs text-void-400">{ROLE_LABELS[role]} <strong className="text-void-200">{pct.toFixed(0)}%</strong></span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Loading skeleton ─────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[80, 65, 50, 40, 30].map(w => (
        <div key={w} className="h-5 bg-void-700/40 rounded" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

/* ── Individual teaser cards ──────────────────────────────────────────── */
function GeneralTeaser({ blob }) {
  const combos = blob?.general?.combos ?? []
  const top5   = [...combos].sort((a, b) => b.count - a.count).slice(0, 5)
  const maxPct = top5[0]?.pct ?? 1
  const total  = blob?.general?.total

  return (
    <div className="card p-5 flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-void-100 tracking-wide">General Population</h2>
        <p className="text-void-500 text-xs mt-0.5">
          {total ? `${(total).toLocaleString()} characters` : 'Guild roster census'} · 10 high-pop US realms
        </p>
      </div>

      {top5.length === 0 ? <Skeleton /> : (
        <div className="space-y-2">
          {top5.map(c => (
            <MiniBar
              key={`${c.race}-${c.class}`}
              label={c.race}
              sublabel={c.class}
              pct={c.pct}
              maxPct={maxPct}
              color={CLASS_COLORS[c.class] ?? '#9b6dff'}
            />
          ))}
        </div>
      )}

      <Link href="/general"
            className="mt-auto text-xs text-yogg-purple hover:text-yogg-eye transition-colors font-medium">
        Explore general demographics →
      </Link>
    </div>
  )
}

function MythicTeaser({ blob }) {
  const specs  = blob?.pve?.specs  ?? []
  const combos = blob?.pve?.combos ?? []
  const total  = combos.reduce((s, c) => s + c.count, 0)

  // Top spec per role
  const topByRole = ['tank', 'healer', 'damage'].map(role => {
    const top = [...specs].filter(s => s.role === role).sort((a, b) => b.count - a.count)[0]
    return top ? { role, ...top } : null
  }).filter(Boolean)

  // Top 3 races from combos
  const raceTotals = {}
  combos.forEach(c => { raceTotals[c.race] = (raceTotals[c.race] ?? 0) + c.count })
  const topRaces = Object.entries(raceTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([race, count]) => ({ race, pct: total > 0 ? (count / total) * 100 : 0 }))

  const roleLabel = { tank: 'Tank', healer: 'Healer', damage: 'DPS' }

  return (
    <div className="card p-5 flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-void-100 tracking-wide">Mythic+</h2>
        <p className="text-void-500 text-xs mt-0.5">
          {total ? `${total.toLocaleString()} characters` : 'Spec & role breakdown'} · rated M+ runs
        </p>
      </div>

      {specs.length === 0 ? <Skeleton /> : (
        <>
          {/* Top spec per role */}
          <div className="space-y-2">
            {topByRole.map(s => (
              <MiniBar
                key={s.role}
                label={s.spec}
                sublabel={`${s.class} · ${roleLabel[s.role]}`}
                pct={s.pct}
                maxPct={topByRole[0]?.pct ?? 1}
                color={ROLE_COLORS[s.role]}
              />
            ))}
          </div>

          {/* Top 3 races */}
          {topRaces.length > 0 && (
            <div className="space-y-2">
              <p className="text-void-600 text-xs uppercase tracking-wider font-semibold">Top Races</p>
              {topRaces.map(({ race, pct }) => (
                <MiniBar
                  key={race}
                  label={race}
                  pct={pct}
                  maxPct={topRaces[0]?.pct ?? 1}
                  color="#9b6dff"
                />
              ))}
            </div>
          )}
        </>
      )}

      <Link href="/mythic"
            className="mt-auto text-xs text-yogg-purple hover:text-yogg-eye transition-colors font-medium">
        Explore Mythic+ breakdown →
      </Link>
    </div>
  )
}

function PvpTeaser({ blob }) {
  const specs = blob?.pvp?.specs ?? []
  const total = (blob?.pvp?.combos ?? []).reduce((s, c) => s + c.count, 0)

  return (
    <div className="card p-5 flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-void-100 tracking-wide">PvP</h2>
        <p className="text-void-500 text-xs mt-0.5">
          {total ? `${total.toLocaleString()} characters` : 'Spec & role breakdown'} · rated PvP leaderboards
        </p>
      </div>

      {specs.length === 0 ? <Skeleton /> : <RoleBar specs={specs} />}

      {specs.length > 0 && (
        <div className="space-y-2">
          {[...specs].sort((a, b) => b.count - a.count).slice(0, 3).map(s => (
            <MiniBar
              key={`${s.class}-${s.spec}`}
              label={s.spec}
              sublabel={s.class}
              pct={s.pct}
              maxPct={specs[0]?.pct ?? 1}
              color={CLASS_COLORS[s.class] ?? '#9b6dff'}
            />
          ))}
        </div>
      )}

      <Link href="/pvp"
            className="mt-auto text-xs text-yogg-purple hover:text-yogg-eye transition-colors font-medium">
        Explore PvP breakdown →
      </Link>
    </div>
  )
}

/* ── Export ───────────────────────────────────────────────────────────── */
export function HubTeasers() {
  const { blob, loading } = useRawBlob()

  const blobOrEmpty = loading ? null : blob

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <GeneralTeaser blob={blobOrEmpty} />
      <MythicTeaser  blob={blobOrEmpty} />
      <PvpTeaser     blob={blobOrEmpty} />
    </div>
  )
}
