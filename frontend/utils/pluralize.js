/**
 * Display-name pluralization helpers for race and class names.
 * Most race names are irregular or already plural.
 */

const RACE_PLURAL_MAP = {
  // Irregular English plurals
  'Night Elf':             'Night Elves',
  'Blood Elf':             'Blood Elves',
  'Void Elf':              'Void Elves',
  'Dark Iron Dwarf':       'Dark Iron Dwarves',
  'Dwarf':                 'Dwarves',
  // Mass nouns / already plural — no change
  'Worgen':                'Worgen',
  'Tauren':                'Tauren',
  'Highmountain Tauren':   'Highmountain Tauren',
  'Pandaren':              'Pandaren',
  'Dracthyr':              'Dracthyr',
  'Earthen':               'Earthen',
  'Haranir':               'Haranir',
}

/**
 * Pluralize a race display name.
 * Neutral race variants like "Pandaren (Horde)" are returned unchanged.
 */
export function pluralRace(displayName) {
  if (!displayName) return displayName
  // Neutral race variant — "Pandaren (Horde)" → leave as-is
  if (displayName.includes('(')) return displayName
  return RACE_PLURAL_MAP[displayName] ?? displayName + 's'
}

/**
 * Pluralize a class display name. All WoW class names take a simple 's'.
 * "Death Knight" → "Death Knights", "Monk" → "Monks", etc.
 */
export function pluralClass(name) {
  if (!name) return name
  return name + 's'
}
