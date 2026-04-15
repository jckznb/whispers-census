/**
 * Alt picker recommendation engine — race + class combos only.
 *
 * Role is treated as class capability: selecting "tank" filters to classes
 * that have a tank spec; selecting "healer" filters to classes with a heal spec.
 * Selecting both restricts to classes that can do all three (Druid, Paladin, Monk).
 * Selecting neither allows any class — DPS is always available to every class.
 *
 * scoreResults() returns { results, warning } where:
 *   results — up to 5 scored recommendations (one per class)
 *   warning — string | null
 */
import { VALID_COMBOS } from './constants'

// Classes that have at least one tank spec
const TANK_CLASSES = new Set([
  'Death Knight',  // Blood
  'Warrior',       // Protection
  'Paladin',       // Protection
  'Druid',         // Guardian
  'Monk',          // Brewmaster
  'Demon Hunter',  // Vengeance
])

// Classes that have at least one healer spec
const HEAL_CLASSES = new Set([
  'Paladin',  // Holy
  'Priest',   // Discipline, Holy
  'Druid',    // Restoration
  'Shaman',   // Restoration
  'Monk',     // Mistweaver
  'Evoker',   // Preservation
])

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

/**
 * Merge pvp + pve combo rows, averaging pct across whichever contexts have data.
 */
function mergeCombos(blob) {
  const combined = {}
  for (const ctx of ['pvp', 'pve']) {
    for (const row of (blob[ctx]?.combos || [])) {
      const key = `${row.race}|${row.class}`
      if (!combined[key]) combined[key] = { ...row, pctSum: 0, pctCount: 0 }
      combined[key].pctSum   += row.pct
      combined[key].pctCount += 1
    }
  }
  return Object.values(combined).map(r => ({ ...r, pct: r.pctSum / r.pctCount }))
}

/**
 * Score and rank race+class combos based on quiz answers.
 *
 * @param {object} blob    - Raw demographics blob from Vercel
 * @param {object} answers - { role: string[], content, popularity, faction, aesthetics: string[] }
 * @returns {{ results: Array, warning: string|null }}
 */
export function scoreResults(blob, answers) {
  const { role = [], content, popularity, faction, aesthetics = [] } = answers

  // Select combo dataset
  let combosRaw
  if (content === 'pvp') {
    combosRaw = blob.pvp?.combos || []
  } else if (content === 'pve') {
    combosRaw = blob.pve?.combos || []
  } else {
    combosRaw = mergeCombos(blob)
  }

  if (!combosRaw.length) return { results: [], warning: null }

  const wantsTank = role.includes('tank')
  const wantsHeal = role.includes('healer')

  // Aesthetic race set
  const aestheticRaceSet = new Set()
  for (const id of aesthetics) {
    const entry = AESTHETICS.find(a => a.id === id)
    if (entry) entry.races.forEach(r => aestheticRaceSet.add(r))
  }

  // Popularity thresholds
  const allPcts = combosRaw.map(r => r.pct).sort((a, b) => a - b)
  const p25    = allPcts[Math.floor(allPcts.length * 0.25)] ?? 0
  const p75    = allPcts[Math.floor(allPcts.length * 0.75)] ?? 1
  const maxPct = allPcts[allPcts.length - 1] ?? 1

  const scored = []

  for (const row of combosRaw) {
    const { race, faction: rowFaction, class: cls, pct } = row

    // Skip impossible combos
    if (!VALID_COMBOS.has(`${race}|${cls}`)) continue

    // Class capability filter:
    //   Selecting tank → class must have a tank spec
    //   Selecting healer → class must have a heal spec
    //   Both selected → class must have all three roles (Druid, Paladin, Monk)
    //   Neither → any class (DPS is available everywhere)
    if (wantsTank  && !TANK_CLASSES.has(cls)) continue
    if (wantsHeal  && !HEAL_CLASSES.has(cls)) continue

    // Faction filter — neutral races pass either faction
    const raceFac = RACE_FACTION[race] || 'neutral'
    if (faction !== 'any' && raceFac !== 'neutral' && raceFac !== faction) continue

    // Scoring
    let score = 50
    if (popularity === 'meta')       score += pct * 3
    else if (popularity === 'rare')  score += (maxPct - pct) * 2

    if (aesthetics.length > 0 && aestheticRaceSet.has(race)) score += 40

    let popularityLabel
    if (pct >= p75)      popularityLabel = 'Meta pick'
    else if (pct <= p25) popularityLabel = 'Rare find'
    else                 popularityLabel = 'Solid choice'

    scored.push({
      race,
      faction:        raceFac === 'neutral' ? (rowFaction || 'neutral') : raceFac,
      class:          cls,
      pct,
      popularityLabel,
      score,
    })
  }

  scored.sort((a, b) => b.score - a.score)

  // One result per class — take the highest-scored race for each class
  const seenClasses = new Set()
  const results     = []
  for (const r of scored) {
    if (!seenClasses.has(r.class)) {
      seenClasses.add(r.class)
      results.push(r)
    }
    if (results.length >= 5) break
  }

  return { results, warning: null }
}
