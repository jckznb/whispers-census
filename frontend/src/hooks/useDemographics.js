/**
 * Fetches demographic data from the pre-baked Vercel Blob JSON.
 * One fetch per page load, cached in module scope — zero Supabase connections.
 *
 * Blob shape:
 *   { updated, pvp: { total, combos, specs, spec_combos }, pve, general }
 *
 * combos:      [{race, faction, class, count, pct}]
 * specs:       [{class, spec, role, count, pct}]
 * spec_combos: [{race, faction, class, spec, count, pct}]
 *
 * Returns:
 *   data       — race+class rows for heatmap/bars/explorer
 *   specData   — class+spec rows for By Spec popularity bars
 *   specCombos — race+class+spec rows for heatmap cell drill-down
 */
import { useState, useEffect } from 'react'

const BLOB_URL = import.meta.env.VITE_DEMOGRAPHICS_URL

let _cache    = null
let _inflight = null

async function getBlob() {
  if (_cache)    return _cache
  if (_inflight) return _inflight
  _inflight = fetch(BLOB_URL)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then(data => { _cache = data; _inflight = null; return data })
  return _inflight
}

function mapCombos(combos) {
  return (combos || []).map(c => ({
    races:      { name: c.race, faction: c.faction },
    classes:    { name: c.class },
    count:      c.count,
    percentage: c.pct,
  }))
}

function mapSpecs(specs) {
  return (specs || []).map(s => ({
    specs:      { name: s.spec, role: s.role },
    classes:    { name: s.class },
    count:      s.count,
    percentage: s.pct,
  }))
}

function mapSpecCombos(specCombos) {
  return (specCombos || []).map(s => ({
    races:      { name: s.race, faction: s.faction },
    classes:    { name: s.class },
    specs:      { name: s.spec },
    count:      s.count,
    percentage: s.pct,
  }))
}

export function useDemographics(context) {
  const [data,       setData]       = useState([])
  const [specData,   setSpecData]   = useState([])
  const [specCombos, setSpecCombos] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [snapshotDate, setSnapshotDate] = useState(null)

  useEffect(() => {
    if (!context) {
      setData([])
      setSpecData([])
      setSpecCombos([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const blob = await getBlob()
        if (cancelled) return

        setSnapshotDate(blob.updated)

        const ctx = blob[context]
        if (!ctx) {
          setData([])
          setSpecData([])
          setSpecCombos([])
          setLoading(false)
          return
        }

        setData(mapCombos(ctx.combos))
        setSpecData(mapSpecs(ctx.specs))
        setSpecCombos(mapSpecCombos(ctx.spec_combos))
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [context])

  return { data, specData, specCombos, loading, error, snapshotDate }
}
