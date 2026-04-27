'use client'

import { useState } from 'react'
import { CONTEXTS } from '@/utils/constants'

function InfoPanel({ ctx }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-3 rounded-lg bg-void-800/50 border border-void-700/40 px-4 py-3 text-sm text-void-400 space-y-2">
      <p>{ctx.summary}</p>

      {ctx.detail && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-void-500 hover:text-void-300 transition-colors"
          >
            <span>{expanded ? '▾' : '▸'}</span>
            <span>How is this data collected?</span>
          </button>

          {expanded && (
            <div className="space-y-1.5 text-xs text-void-500 border-t border-void-700/40 pt-2">
              <p>{ctx.detail}</p>
              {ctx.caveat && (
                <p className="text-void-600 italic">{ctx.caveat}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function ContextSelector({ context, onChange }) {
  const phase1 = CONTEXTS.filter(c => c.phase === 1)
  const future = CONTEXTS.filter(c => c.phase > 1)
  const activeCtx = CONTEXTS.find(c => c.id === context)

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        {phase1.map(ctx => (
          <button
            key={ctx.id}
            onClick={() => onChange(ctx.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              context === ctx.id
                ? 'bg-yogg-purple text-white shadow-lg shadow-yogg-purple/30'
                : 'bg-void-700/50 text-void-300 hover:bg-void-600/50 hover:text-void-100'
            }`}
          >
            {ctx.label}
          </button>
        ))}
        <div className="w-px h-5 bg-void-600/50 mx-1" />
        {future.map(ctx => (
          <button
            key={ctx.id}
            disabled
            title="Coming in a future phase"
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-void-800/30 text-void-600 cursor-not-allowed"
          >
            {ctx.label}
            <span className="ml-1.5 text-xs opacity-60">soon</span>
          </button>
        ))}
      </div>

      {activeCtx && <InfoPanel key={activeCtx.id} ctx={activeCtx} />}
    </div>
  )
}
