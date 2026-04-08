// WoW class colors (official Blizzard UI colors)
export const CLASS_COLORS = {
  'Death Knight': '#C41E3A',
  'Demon Hunter': '#A330C9',
  'Druid':        '#FF7C0A',
  'Evoker':       '#33937F',
  'Hunter':       '#AAD372',
  'Mage':         '#3FC7EB',
  'Monk':         '#00FF98',
  'Paladin':      '#F48CBA',
  'Priest':       '#FFFFFF',
  'Rogue':        '#FFF468',
  'Shaman':       '#0070DD',
  'Warlock':      '#8788EE',
  'Warrior':      '#C69B3A',
}

export const CLASS_COLORS_DIM = {
  'Death Knight': '#7a1223',
  'Demon Hunter': '#621e78',
  'Druid':        '#994a07',
  'Evoker':       '#1f594c',
  'Hunter':       '#677f46',
  'Mage':         '#267891',
  'Monk':         '#00995c',
  'Paladin':      '#925270',
  'Priest':       '#999999',
  'Rogue':        '#999240',
  'Shaman':       '#004385',
  'Warlock':      '#525384',
  'Warrior':      '#7a5d23',
}

export const FACTION_COLORS = {
  alliance: '#1a6eb5',
  horde:    '#8c1c1c',
  neutral:  '#6b7280',
}

export const ROLE_COLORS = {
  tank:   '#4b9ef4',
  healer: '#4ade80',
  dps:    '#f87171',
}

// PvP bracket display names
export const BRACKET_LABELS = {
  '2v2':     '2v2 Arena',
  '3v3':     '3v3 Arena',
  'rbg':     'Rated BG',
  'pvp_all': 'All Brackets',
}

// Contexts served by the demographics blob
export const CONTEXTS = [
  {
    id: 'pvp',
    label: 'All PvP',
    phase: 1,
    summary: 'Characters from the US Rated PvP leaderboards — 2v2 arena, 3v3 arena, Rated Battlegrounds, and Solo Shuffle. Snapshot from Season 41.',
    detail: 'This dataset includes every character that appeared on a rated PvP leaderboard during Season 41. Characters are deduplicated across brackets, so a player who competes in both 2v2 and 3v3 is counted once. ~151,700 unique characters. This reflects active PvP players, not the general playerbase — expect the meta picks and specialized specs to be overrepresented.',
    caveat: 'US region only. Leaderboard data skews toward players who push rating, not casual PvP.',
  },
  {
    id: 'pve',
    label: 'Mythic+',
    phase: 1,
    summary: 'Characters from US Mythic Keystone dungeon leaderboards. Covers the top runs across all dungeons and connected realms.',
    detail: 'This dataset is built from the Mythic+ leaderboard — the highest-scoring timed keystone runs per dungeon per realm. Each run has 5 characters; all members are recorded. Characters are deduplicated across runs and dungeons. ~198,400 unique characters. This reflects active M+ pushers, particularly those who have completed high-level keys.',
    caveat: 'US region only. Covers leaderboard-ranked runs only — casual M+ players who never appear on a leaderboard are not included.',
  },
  {
    id: 'general',
    label: 'General Population',
    phase: 3,
    summary: 'A broad sample of the WoW playerbase, not limited to any one activity. Coming in a future update.',
    detail: 'This phase will crawl guild rosters across all US realms to build a representative sample of the overall player population — including players who do not engage with rated PvP or high-end Mythic+.',
    caveat: null,
  },
]

// Races that exist in both factions — displayed as "Race (A)" / "Race (H)" in the UI
export const NEUTRAL_RACES = new Set(['Pandaren', 'Earthen', 'Dracthyr', 'Haranir'])

/** Returns the display name for a race, appending faction suffix for neutral races. */
export function getRaceDisplayName(baseName, faction) {
  if (baseName && NEUTRAL_RACES.has(baseName) && faction) {
    return `${baseName} (${faction === 'alliance' ? 'A' : 'H'})`
  }
  return baseName
}

/** Strips the faction suffix so VALID_COMBOS lookups always use the base race name. */
export function getBaseRaceName(displayName) {
  return displayName ? displayName.replace(/ \([AH]\)$/, '') : displayName
}

// Valid race/class combinations (0 = invalid, grayed out in heatmap)
// Keyed as 'RaceName|ClassName'
// This list covers all retail combos as of The War Within
export const VALID_COMBOS = new Set([
  // Human
  'Human|Death Knight', 'Human|Hunter', 'Human|Mage', 'Human|Monk',
  'Human|Paladin', 'Human|Priest', 'Human|Rogue', 'Human|Warlock', 'Human|Warrior',
  // Dwarf
  'Dwarf|Death Knight', 'Dwarf|Hunter', 'Dwarf|Mage', 'Dwarf|Monk',
  'Dwarf|Paladin', 'Dwarf|Priest', 'Dwarf|Rogue', 'Dwarf|Shaman',
  'Dwarf|Warlock', 'Dwarf|Warrior',
  // Night Elf
  'Night Elf|Death Knight', 'Night Elf|Demon Hunter', 'Night Elf|Druid',
  'Night Elf|Hunter', 'Night Elf|Mage', 'Night Elf|Monk', 'Night Elf|Priest',
  'Night Elf|Rogue', 'Night Elf|Warrior',
  // Gnome
  'Gnome|Death Knight', 'Gnome|Hunter', 'Gnome|Mage', 'Gnome|Monk',
  'Gnome|Priest', 'Gnome|Rogue', 'Gnome|Warlock', 'Gnome|Warrior',
  // Draenei
  'Draenei|Death Knight', 'Draenei|Hunter', 'Draenei|Mage', 'Draenei|Monk',
  'Draenei|Paladin', 'Draenei|Priest', 'Draenei|Shaman', 'Draenei|Warrior',
  // Worgen
  'Worgen|Death Knight', 'Worgen|Druid', 'Worgen|Hunter', 'Worgen|Mage',
  'Worgen|Priest', 'Worgen|Rogue', 'Worgen|Warlock', 'Worgen|Warrior',
  // Void Elf
  'Void Elf|Death Knight', 'Void Elf|Hunter', 'Void Elf|Mage', 'Void Elf|Monk',
  'Void Elf|Priest', 'Void Elf|Rogue', 'Void Elf|Warlock', 'Void Elf|Warrior',
  // Lightforged Draenei
  'Lightforged Draenei|Death Knight', 'Lightforged Draenei|Hunter',
  'Lightforged Draenei|Mage', 'Lightforged Draenei|Paladin',
  'Lightforged Draenei|Priest', 'Lightforged Draenei|Warrior',
  // Dark Iron Dwarf
  'Dark Iron Dwarf|Death Knight', 'Dark Iron Dwarf|Hunter', 'Dark Iron Dwarf|Mage',
  'Dark Iron Dwarf|Monk', 'Dark Iron Dwarf|Paladin', 'Dark Iron Dwarf|Priest',
  'Dark Iron Dwarf|Rogue', 'Dark Iron Dwarf|Shaman', 'Dark Iron Dwarf|Warlock',
  'Dark Iron Dwarf|Warrior',
  // Kul Tiran
  'Kul Tiran|Death Knight', 'Kul Tiran|Druid', 'Kul Tiran|Hunter',
  'Kul Tiran|Mage', 'Kul Tiran|Monk', 'Kul Tiran|Priest', 'Kul Tiran|Rogue',
  'Kul Tiran|Shaman', 'Kul Tiran|Warrior',
  // Mechagnome
  'Mechagnome|Death Knight', 'Mechagnome|Hunter', 'Mechagnome|Mage',
  'Mechagnome|Monk', 'Mechagnome|Priest', 'Mechagnome|Rogue',
  'Mechagnome|Warlock', 'Mechagnome|Warrior',
  // Orc
  'Orc|Death Knight', 'Orc|Hunter', 'Orc|Mage', 'Orc|Monk', 'Orc|Rogue',
  'Orc|Shaman', 'Orc|Warlock', 'Orc|Warrior',
  // Undead
  'Undead|Death Knight', 'Undead|Hunter', 'Undead|Mage', 'Undead|Monk',
  'Undead|Priest', 'Undead|Rogue', 'Undead|Warlock', 'Undead|Warrior',
  // Tauren
  'Tauren|Death Knight', 'Tauren|Druid', 'Tauren|Hunter', 'Tauren|Monk',
  'Tauren|Paladin', 'Tauren|Priest', 'Tauren|Shaman', 'Tauren|Warrior',
  // Troll
  'Troll|Death Knight', 'Troll|Druid', 'Troll|Hunter', 'Troll|Mage',
  'Troll|Monk', 'Troll|Priest', 'Troll|Rogue', 'Troll|Shaman',
  'Troll|Warlock', 'Troll|Warrior',
  // Blood Elf
  'Blood Elf|Death Knight', 'Blood Elf|Demon Hunter', 'Blood Elf|Hunter',
  'Blood Elf|Mage', 'Blood Elf|Monk', 'Blood Elf|Paladin', 'Blood Elf|Priest',
  'Blood Elf|Rogue', 'Blood Elf|Warlock', 'Blood Elf|Warrior',
  // Goblin
  'Goblin|Death Knight', 'Goblin|Hunter', 'Goblin|Mage', 'Goblin|Monk',
  'Goblin|Priest', 'Goblin|Rogue', 'Goblin|Shaman', 'Goblin|Warlock',
  'Goblin|Warrior',
  // Nightborne
  'Nightborne|Death Knight', 'Nightborne|Hunter', 'Nightborne|Mage',
  'Nightborne|Monk', 'Nightborne|Priest', 'Nightborne|Rogue',
  'Nightborne|Warlock', 'Nightborne|Warrior',
  // Highmountain Tauren
  'Highmountain Tauren|Death Knight', 'Highmountain Tauren|Druid',
  'Highmountain Tauren|Hunter', 'Highmountain Tauren|Monk',
  'Highmountain Tauren|Shaman', 'Highmountain Tauren|Warrior',
  // Mag\'har Orc
  "Mag'har Orc|Death Knight", "Mag'har Orc|Hunter", "Mag'har Orc|Mage",
  "Mag'har Orc|Monk", "Mag'har Orc|Priest", "Mag'har Orc|Rogue",
  "Mag'har Orc|Shaman", "Mag'har Orc|Warrior",
  // Zandalari Troll
  'Zandalari Troll|Death Knight', 'Zandalari Troll|Druid',
  'Zandalari Troll|Hunter', 'Zandalari Troll|Mage', 'Zandalari Troll|Monk',
  'Zandalari Troll|Paladin', 'Zandalari Troll|Priest', 'Zandalari Troll|Rogue',
  'Zandalari Troll|Shaman', 'Zandalari Troll|Warrior',
  // Vulpera
  'Vulpera|Death Knight', 'Vulpera|Hunter', 'Vulpera|Mage', 'Vulpera|Monk',
  'Vulpera|Priest', 'Vulpera|Rogue', 'Vulpera|Shaman', 'Vulpera|Warlock',
  'Vulpera|Warrior',
  // Pandaren (neutral — both factions)
  'Pandaren|Death Knight', 'Pandaren|Hunter', 'Pandaren|Mage', 'Pandaren|Monk',
  'Pandaren|Priest', 'Pandaren|Rogue', 'Pandaren|Shaman', 'Pandaren|Warrior',
  // Dracthyr
  'Dracthyr|Evoker', 'Dracthyr|Rogue', 'Dracthyr|Warrior', 'Dracthyr|Priest',
  'Dracthyr|Hunter', 'Dracthyr|Mage',
  // Earthen
  'Earthen|Death Knight', 'Earthen|Hunter', 'Earthen|Mage', 'Earthen|Monk',
  'Earthen|Paladin', 'Earthen|Priest', 'Earthen|Rogue', 'Earthen|Shaman',
  'Earthen|Warlock', 'Earthen|Warrior',
])

// Ordered by in-game release date (Vanilla → WotLK → MoP → Legion → Dragonflight)
export const CLASS_ORDER = [
  'Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest',
  'Shaman', 'Mage', 'Warlock', 'Druid',
  'Death Knight', 'Monk', 'Demon Hunter', 'Evoker',
]
