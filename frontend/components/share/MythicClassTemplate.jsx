'use client'

import { forwardRef } from 'react'
import { CLASS_COLORS } from '@/utils/constants'

// Mirrors: ClassDonut in MythicPageClient
// Renders at 600×315 DOM px → captured at 1200×630 (pixelRatio:2)
// If ClassDonut or its data source changes, update this template too.

const BG        = '#0d0518'
const CARD_BG   = '#160830'
const TEXT_HI   = '#e8deff'
const TEXT_MID  = '#9b6dff'
const TEXT_DIM  = '#3d1a6e'
const ACCENT    = '#9b4cc4'

const R    = 42
const CIRC = 2 * Math.PI * R

function buildSegments(specs) {
  const totals = {}
  ;(specs || []).forEach(s => {
    if (s.class) totals[s.class] = (totals[s.class] ?? 0) + s.count
  })
  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  if (total === 0) return { segments: [], sorted: [] }

  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      pct: (count / total) * 100,
      color: CLASS_COLORS[name] ?? '#9b6dff',
    }))

  let cumulative = 0
  const segments = sorted.map(s => {
    const seg = { ...s, cumulativePct: cumulative }
    cumulative += s.pct
    return seg
  })

  return { segments, sorted }
}

function DonutSegment({ pct, color, cumulativePct }) {
  const segLen  = (pct / 100) * CIRC
  const gap     = Math.min(2, segLen * 0.08)
  const visible = Math.max(0, segLen - gap)
  const offset  = CIRC * 0.25 - (cumulativePct / 100) * CIRC
  return (
    <circle cx="60" cy="60" r={R} fill="none"
      stroke={color} strokeWidth="18"
      strokeDasharray={`${visible} ${CIRC - visible}`}
      strokeDashoffset={offset}
    />
  )
}

export const MythicClassTemplate = forwardRef(function MythicClassTemplate(
  { specs, total, updatedDate },
  ref
) {
  const { segments, sorted } = buildSegments(specs)

  const date = updatedDate
    ? new Date(updatedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : ''

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', left: '-9999px', top: 0, zIndex: -1,
        width: 600, height: 315,
        background: BG,
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        display: 'flex', flexDirection: 'column',
        padding: '24px 28px 20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-cinzel), Cinzel, serif',
            fontSize: 13, fontWeight: 600, letterSpacing: '0.12em',
            color: ACCENT, textTransform: 'uppercase', marginBottom: 4,
          }}>
            Whispers Census · Mythic+
          </div>
          <div style={{
            fontFamily: 'var(--font-cinzel), Cinzel, serif',
            fontSize: 22, fontWeight: 700, color: TEXT_HI, letterSpacing: '0.04em',
          }}>
            Class Distribution
          </div>
          {total > 0 && (
            <div style={{ fontSize: 11, color: TEXT_MID, marginTop: 3 }}>
              {total.toLocaleString()} characters · US Servers
            </div>
          )}
        </div>
        {/* Decorative eye glyph */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#1e0a3c', border: '1.5px solid #9b4cc4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#c084fc' }} />
        </div>
      </div>

      {/* Body: donut + legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
        {/* Donut */}
        <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, flexShrink: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r={R} fill="none" stroke="#1a0a30" strokeWidth="18" />
          {segments.map(s => (
            <DonutSegment key={s.name} pct={s.pct} color={s.color} cumulativePct={s.cumulativePct} />
          ))}
        </svg>

        {/* Legend — 2 columns */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '5px 20px', flex: 1,
        }}>
          {sorted.map(({ name, pct, color }) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: TEXT_HI, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </span>
              <span style={{ fontSize: 11, color: TEXT_MID, flexShrink: 0, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
                {pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 16, paddingTop: 12,
        borderTop: `1px solid ${TEXT_DIM}`,
      }}>
        <span style={{ fontSize: 11, color: TEXT_MID, fontFamily: 'var(--font-cinzel), Cinzel, serif', letterSpacing: '0.08em' }}>
          whisperscensus.app
        </span>
        {date && (
          <span style={{ fontSize: 10, color: TEXT_DIM }}>Updated {date}</span>
        )}
      </div>
    </div>
  )
})
