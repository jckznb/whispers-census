/**
 * Fetches demographic data from the pre-baked Vercel Blob JSON.
 * One fetch per page load, cached in module scope — zero Supabase connections.
 *
 * The blob shape is:
 *   { updated, pvp: { total, combos: [{race, faction, class, count, pct}] }, pve, general }
 *
 * Returns data in the same shape the visualization components expect:
 *   { races: { name, faction }, classes: { name }, count, percentage }
 */
import { useState, useEffect } from 'react'

const BLOB_URL = import.meta.env.VITE_DEMOGRAPHICS_URL

// Module-level cache — shared across all hook instances
let _cache = null
let _inflight = null

async function getBlob() {
  if (_cache) return _cache
  if (_inflight) return _inflight
  _inflight = fetch(BLOB_URL)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then(data => { _cache = data; _inflight = null; return data })
  return _inflight
}

export function useDemographics(context) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snapshotDate, setSnapshotDate] = useState(null)

  useEffect(() => {
    if (!context) {
      setData([])
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
          setLoading(false)
          return
        }

        // Map flat blob combos to the nested shape the components expect
        const rows = ctx.combos.map(c => ({
          races:      { name: c.race, faction: c.faction },
          classes:    { name: c.class },
          count:      c.count,
          percentage: c.pct,
        }))

        setData(rows)
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

  return { data, loading, error, snapshotDate }
}
