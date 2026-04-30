'use client'

import { forwardRef, useState, useEffect } from 'react'
import { CLASS_COLORS } from '@/utils/constants'

// Mirrors: ClassBars in MythicPageClient
// Renders at 540×540 DOM px → captured at 1080×1080 (pixelRatio:2)
// Logo is pre-fetched as base64 on mount so html-to-image sees a data URL, not a path.

const BG       = '#0d0518'
const TEXT_HI  = '#e8deff'
const TEXT_MID = '#9b6dff'
const TEXT_DIM = '#3d1a6e'
const ACCENT   = '#9b4cc4'

function useLogoDataUrl() {
  const [src, setSrc] = useState('')
  useEffect(() => {
    fetch('/favicon-32x32.png')
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onload = e => setSrc(e.target.result)
        reader.readAsDataURL(blob)
      })
      .catch(() => {})
  }, [])
  return src
}

function buildBars(specs) {
  const totals = {}
  ;(specs || []).forEach(s => {
    if (s.class) totals[s.class] = (totals[s.class] ?? 0) + s.count
  })
  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  if (total === 0) return { bars: [], total: 0 }

  const bars = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      pct: (count / total) * 100,
      color: CLASS_COLORS[name] ?? '#9b6dff',
    }))

  return { bars, total }
}

export const MythicClassTemplate = forwardRef(function MythicClassTemplate(
  { specs, total, updatedDate },
  ref
) {
  const { bars } = buildBars(specs)
  const maxPct = bars[0]?.pct ?? 1
  const logoSrc = useLogoDataUrl()

  const date = updatedDate
    ? new Date(updatedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : ''

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: 0, height: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      <div
        ref={ref}
        style={{
          width: 540, height: 540,
          background: BG,
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 32px 20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          {logoSrc && (
            <img src={logoSrc} width={36} height={36}
              style={{ borderRadius: 4, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.14em',
              color: ACCENT, textTransform: 'uppercase', marginBottom: 3,
            }}>
              Whispers Census · Mythic+
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: TEXT_HI, lineHeight: 1.1 }}>
              Class Distribution
            </div>
          </div>
          {total > 0 && (
            <div style={{ fontSize: 11, color: TEXT_MID, textAlign: 'right', flexShrink: 0 }}>
              {total.toLocaleString()}<br />
              <span style={{ color: TEXT_DIM, fontSize: 10 }}>characters · US</span>
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {bars.map(({ name, pct, color }) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 11, color: TEXT_HI,
                width: 100, flexShrink: 0,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {name}
              </span>
              <div style={{
                flex: 1, height: 12, borderRadius: 3,
                background: '#1a0a30', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(pct / maxPct) * 100}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: color,
                }} />
              </div>
              <span style={{
                fontSize: 11, color: TEXT_MID,
                width: 38, flexShrink: 0, textAlign: 'right',
              }}>
                {pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 14, paddingTop: 10,
          borderTop: `1px solid ${TEXT_DIM}`,
        }}>
          <span style={{ fontSize: 11, color: TEXT_MID, letterSpacing: '0.08em' }}>
            whisperscensus.com
          </span>
          {date && (
            <span style={{ fontSize: 10, color: TEXT_DIM }}>Updated {date}</span>
          )}
        </div>
      </div>
    </div>
  )
})
