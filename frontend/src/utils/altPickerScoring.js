/**
 * Alt picker recommendation engine.
 * Takes user answers from the quiz + raw blob data → ranked (race, spec) suggestions.
 *
 * scoreResults() returns { results, warning } where:
 *   results — top-5 scored recommendations
 *   warning — string | null — set when we had to fall back (e.g. no spec data)
 */
import { VALID_COMBOS } from './constants'

// Aesthetic vibes with their associated races
export const AESTHETICS = [
  {
    id:    'dark_gothic',
    label: 'Dark & Gothic',
    emoji: '💀',
    desc:  'Undead, shadowy, brooding',
    races: ['Undead', 'Void Elf', 'Worgen', 'Dark Iron Dwarf', 'Nightborne'],
  },
  {
    id:    'nature_primal',
    label: 'Nature & Primal',
    emoji: '🌿',
    desc:  'Wild, tribal, earth-bound',
    races: ['Night Elf', 'Tauren', 'Highmountain Tauren', 'Kul Tiran', 'Troll', 'Zandalari Troll', 'Worgen'],
  },
  {
    id:    'arcane_magic',
    label: 'Arcane & Magical',
    emoji: '✨',
    desc:  'Spellweavers, scholars, ethereal',
    races: ['Blood Elf', 'Nightborne', 'Gnome', 'Void Elf', 'Dracthyr'],
  },
  {
    id:    'noble_knightly',
    label: 'Noble & Knightly',
    emoji: '⚜️',
    desc:  'Honor, duty, imposing presence',
    races: ['Human', 'Draenei', 'Lightforged Draenei', 'Blood Elf', 'Earthen', 'Dwarf'],
  },
  {
    id:    'clever_tech',
    label: 'Clever & Technical',
    emoji: '⚙️',
    desc:  'Inventive, quirky, engineering-minded',
    races: ['Gnome', 'Mechagnome', 'Goblin', 'Dark Iron Dwarf'],
  },
  {
    id:    'draconic',
    label: 'Draconic & Ancient',
    emoji: '🐉',
    desc:  'Dragon-touched, primordial power',
    races: ['Dracthyr', 'Earthen'],
  },
  {
    id:    'small_cunning',
    label: 'Small & Cunning',
    emoji: '🦊',
    desc:  'Nimble, resourceful, underestimated',
    races: ['Gnome', 'Goblin', 'Vulpera', 'Pandaren', 'Mechagnome'],
  },
]

export const RACE_FACTION = {
  Human:                 'alliance',
  Dwarf:                 'alliance',
  'Night Elf':           'alliance',
  Gnome:                 'alliance',
  Draenei:               'alliance',
  Worgen:                'alliance',
  'Void Elf':            'alliance',
  'Lightforged Draenei': 'alliance',
  'Dark Iron Dwarf':     'alliance',
  'Kul Tiran':           'alliance',
  Mechagnome:            'alliance',
  Orc:                   'horde',
  Undead:                'horde',
  Tauren:                'horde',
  Troll:                 'horde',
  'Blood Elf':           'horde',
  Goblin:                'horde',
  Nightborne:            'horde',
  'Highmountain Tauren': 'horde',
  "Mag'har Orc":         'horde',
  'Zandalari Troll':     'horde',
  Vulpera:               'horde',
  Pandaren:              'neutral',
  Dracthyr:              'neutral',
  Earthen:               'neutral',
  Haranir:               'neutral',
}

function mergeSpecCombos(blob) {
  const combined = {}
  for (const ctx of ['pvp', 'pve']) {
    for (const row of (blob[ctx]?.spec_combos || [])) {
      const key = `${row.race}|${row.class}|${row.spec}`
      if (!combined[key]) combined[key] = { ...row, pctSum: 0, pctCount: 0 }
      combined[key].pctSum   += row.pct
      combined[key].pctCount += 1
    }
  }
  return Object.values(combined).map(r => ({ ...r, pct: r.pctSum / r.pctCount }))
}

function mergeSpecs(blob) {
  const combined = {}
  for (const ctx of ['pvp', 'pve']) {
    for (const row of (blob[ctx]?.specs || [])) {
      const key = `${row.class}|${row.spec}`
      if (!combined[key]) combined[key] = { ...row, pctSum: 0, pctCount: 0 }
      combined[key].pctSum   += row.pct
      combined[key].pctCount += 1
    }
  }
  return Object.values(combined).map(r => ({ ...r, pct: r.pctSum / r.pctCount }))
}

/**
 * Build candidates from combo (race+class) data when spec_combos is unavailable.
 * Role filtering is skipped since we don't know each character's spec.
 * Returns { candidates, warning }.
 */
function buildComboFallbackCandidates(blob, content) {
  let combosRaw = []
  if (content === 'pvp') {
    combosRaw = blob.pvp?.combos || []
  } else if (content === 'pve') {
    combosRaw = blob.pve?.combos || []
  } else {
    // Merge pvp + pve combos
    const combined = {}
    for (const ctx of ['pvp', 'pve']) {
      for (const row of (blob[ctx]?.combos || [])) {
        const key = `${row.race}|${row.class}`
        if (!combined[key]) combined[key] = { ...row, pctSum: 0, pctCount: 0 }
        combined[key].pctSum   += row.pct
        combined[key].pctCount += 1
      }
    }
    combosRaw = Object.values(combined).map(r => ({ ...r, pct: r.pctSum / r.pctCount }))
  }
  return combosRaw
}

/**
 * Score and rank (race, spec) combos based on quiz answers.
 * Falls back to race+class combos if spec data isn't available for the chosen context.
 *
 * @param {object} blob    - Raw demographics blob from Vercel
 * @param {object} answers - { role, content, popularity, faction, aesthetics[] }
 * @returns {{ results: Array, warning: string|null }}
 */
export function scoreResults(blob, answers) {
  const { role, content, popularity, faction, aesthetics = [] } = answers

  // Select dataset(s)
  let specCombosRaw, specsRaw
  if (content === 'pvp') {
    specCombosRaw = blob.pvp?.spec_combos || []
    specsRaw      = blob.pvp?.specs       || []
  } else if (content === 'pve') {
    specCombosRaw = blob.pve?.spec_combos || []
    specsRaw      = blob.pve?.specs       || []
  } else {
    specCombosRaw = mergeSpecCombos(blob)
    specsRaw      = mergeSpecs(blob)
  }

  // --- Fallback: no spec data for this content context ---
  // Use race+class combos instead and skip role filtering.
  const usingFallback = specCombosRaw.length === 0
  if (usingFallback) {
    const combosRaw = buildComboFallbackCandidates(blob, content)
    if (!combosRaw.length) return { results: [], warning: null }

    const allPcts = combosRaw.map(r => r.pct).sort((a, b) => a - b)
    const p25     = allPcts[Math.floor(allPcts.length * 0.25)] ?? 0
    const p75     = allPcts[Math.floor(allPcts.length * 0.75)] ?? 1
    const maxPct  = allPcts[allPcts.length - 1] ?? 1

    const aestheticRaceSet = new Set()
    for (const id of aesthetics) {
      const entry = AESTHETICS.find(a => a.id === id)
      if (entry) entry.races.forEach(r => aestheticRaceSet.add(r))
    }

    const scored = []
    for (const row of combosRaw) {
      const { race, faction: rowFaction, class: cls, pct } = row
      if (!VALID_COMBOS.has(`${race}|${cls}`)) continue

      const raceFac = RACE_FACTION[race] || 'neutral'
      if (faction !== 'any' && raceFac !== 'neutral' && raceFac !== faction) continue

      let score = 50
      if (popularity === 'meta') score += pct * 3
      else if (popularity === 'rare') score += (maxPct - pct) * 2
      if (aesthetics.length > 0 && aestheticRaceSet.has(race)) score += 40

      let popularityLabel
      if (pct >= p75)      popularityLabel = 'Meta pick'
      else if (pct <= p25) popularityLabel = 'Rare find'
      else                 popularityLabel = 'Solid choice'

      scored.push({
        race,
        faction:        raceFac === 'neutral' ? (rowFaction || 'neutral') : raceFac,
        class:          cls,
        spec:           null,
        role:           null,
        pct,
        popularityLabel,
        score,
      })
    }

    scored.sort((a, b) => b.score - a.score)

    // Deduplicate by class (one result per class in fallback mode)
    const seenClasses = new Set()
    const results = []
    for (const r of scored) {
      if (!seenClasses.has(r.class)) {
        seenClasses.add(r.class)
        results.push(r)
      }
      if (results.length >= 5) break
    }

    const ctxLabel = content === 'pvp' ? 'PvP' : content === 'pve' ? 'Mythic+' : 'combined'
    return {
      results,
      warning: `Spec-level data isn't available for the ${ctxLabel} dataset yet — showing by race + class instead. Role preference was not applied.`,
    }
  }

  // --- Normal path: spec_combos available ---

  // Build spec → role lookup
  const specRoleMap = {}
  for (const s of specsRaw) {
    specRoleMap[`${s.class}|${s.spec}`] = s.role
  }

  // Build aesthetic race set for fast lookup
  const aestheticRaceSet = new Set()
  for (const id of aesthetics) {
    const entry = AESTHETICS.find(a => a.id === id)
    if (entry) entry.races.forEach(r => aestheticRaceSet.add(r))
  }

  // Popularity thresholds for labeling
  const allPcts = specCombosRaw.map(r => r.pct).sort((a, b) => a - b)
  const p25     = allPcts[Math.floor(allPcts.length * 0.25)] ?? 0
  const p75     = allPcts[Math.floor(allPcts.length * 0.75)] ?? 1
  const maxPct  = allPcts[allPcts.length - 1] ?? 1

  const scored = []

  for (const row of specCombosRaw) {
    const { race, class: cls, spec, pct } = row

    // Skip invalid race/class combos
    if (!VALID_COMBOS.has(`${race}|${cls}`)) continue

    // Role filter
    const specRole = specRoleMap[`${cls}|${spec}`]
    if (role !== 'any' && specRole && specRole !== role) continue

    // Faction filter
    const raceFac = RACE_FACTION[race] || 'neutral'
    if (faction !== 'any' && raceFac !== 'neutral' && raceFac !== faction) continue

    // --- Scoring ---
    let score = 50
    if (popularity === 'meta') score += pct * 3
    else if (popularity === 'rare') score += (maxPct - pct) * 2
    if (aesthetics.length > 0 && aestheticRaceSet.has(race)) score += 40

    // Popularity label for display
    let popularityLabel
    if (pct >= p75)      popularityLabel = 'Meta pick'
    else if (pct <= p25) popularityLabel = 'Rare find'
    else                 popularityLabel = 'Solid choice'

    scored.push({
      race,
      faction:        raceFac,
      class:          cls,
      spec,
      role:           specRole || 'dps',
      pct,
      popularityLabel,
      score,
    })
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score)

  // Deduplicate: one result per spec
  const seenSpecs = new Set()
  const results   = []
  for (const r of scored) {
    const key = `${r.class}|${r.spec}`
    if (!seenSpecs.has(key)) {
      seenSpecs.add(key)
      results.push(r)
    }
    if (results.length >= 5) break
  }

  return { results, warning: null }
}
