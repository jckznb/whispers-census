'use client'

import { forwardRef } from 'react'
import { CLASS_COLORS } from '@/utils/constants'

// Mirrors: ClassDonut in MythicPageClient
// Renders at 540×540 DOM px → captured at 1080×1080 (pixelRatio:2)
// Outer wrapper clips it to 0×0; inner div is a plain block for reliable html-to-image capture.
// If ClassDonut or its data source changes, update this template too.

const BG      = '#0d0518'
const TEXT_HI = '#e8deff'
const TEXT_MID = '#9b6dff'
const TEXT_DIM = '#3d1a6e'
const ACCENT   = '#9b4cc4'

const R    = 48
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
  const gap     = Math.min(2.5, segLen * 0.08)
  const visible = Math.max(0, segLen - gap)
  const offset  = CIRC * 0.25 - (cumulativePct / 100) * CIRC
  return (
    <circle cx="70" cy="70" r={R} fill="none"
      stroke={color} strokeWidth="20"
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
    // Outer: fixed 0×0 overflow-hidden so it doesn't affect page layout
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: 0, height: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      {/* Inner: plain block element — no special positioning, reliable for html-to-image */}
      <div
        ref={ref}
        style={{
          width: 540, height: 540,
          background: BG,
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 32px 24px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <img src="/logo.png" alt="" width={36} height={36}
            style={{ borderRadius: 6, flexShrink: 0 }} />
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
              color: ACCENT, textTransform: 'uppercase', marginBottom: 3,
            }}>
              Whispers Census · Mythic+
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: TEXT_HI, letterSpacing: '0.02em',
              lineHeight: 1.1,
            }}>
              Class Distribution
            </div>
          </div>
          {total > 0 && (
            <div style={{ marginLeft: 'auto', fontSize: 11, color: TEXT_MID, textAlign: 'right', flexShrink: 0 }}>
              {total.toLocaleString()}<br />
              <span style={{ color: TEXT_DIM }}>characters</span>
            </div>
          )}
        </div>

        {/* Donut + Legend — side by side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
          {/* Donut */}
          <div style={{ flexShrink: 0 }}>
            <svg viewBox="0 0 140 140" width="200" height="200"
              style={{ transform: 'rotate(-90deg)', display: 'block' }}>
              <circle cx="70" cy="70" r={R} fill="none" stroke="#1a0a30" strokeWidth="20" />
              {segments.map(s => (
                <DonutSegment key={s.name} pct={s.pct} color={s.color} cumulativePct={s.cumulativePct} />
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 16px',
            flex: 1,
            alignContent: 'center',
          }}>
            {sorted.map(({ name, pct, color }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: TEXT_HI, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                </span>
                <span style={{ fontSize: 13, color: TEXT_MID, flexShrink: 0, marginLeft: 4 }}>
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
          <span style={{ fontSize: 12, color: TEXT_MID, letterSpacing: '0.08em' }}>
            whisperscensus.com
          </span>
          {date && (
            <span style={{ fontSize: 11, color: TEXT_DIM }}>Updated {date}</span>
          )}
        </div>
      </div>
    </div>
  )
})
