/**
 * Static nav data for the site header and homepage browse grids.
 * Update when Blizzard adds new classes or races.
 */

export const CLASS_NAV = [
  { slug: 'death-knight', name: 'Death Knight' },
  { slug: 'demon-hunter', name: 'Demon Hunter' },
  { slug: 'druid',        name: 'Druid' },
  { slug: 'evoker',       name: 'Evoker' },
  { slug: 'hunter',       name: 'Hunter' },
  { slug: 'mage',         name: 'Mage' },
  { slug: 'monk',         name: 'Monk' },
  { slug: 'paladin',      name: 'Paladin' },
  { slug: 'priest',       name: 'Priest' },
  { slug: 'rogue',        name: 'Rogue' },
  { slug: 'shaman',       name: 'Shaman' },
  { slug: 'warlock',      name: 'Warlock' },
  { slug: 'warrior',      name: 'Warrior' },
]

export const RACE_NAV = {
  alliance: [
    { slug: 'human',               name: 'Human' },
    { slug: 'dwarf',               name: 'Dwarf' },
    { slug: 'night-elf',           name: 'Night Elf' },
    { slug: 'gnome',               name: 'Gnome' },
    { slug: 'draenei',             name: 'Draenei' },
    { slug: 'worgen',              name: 'Worgen' },
    { slug: 'void-elf',            name: 'Void Elf' },
    { slug: 'lightforged-draenei', name: 'Lightforged Draenei' },
    { slug: 'dark-iron-dwarf',     name: 'Dark Iron Dwarf' },
    { slug: 'kul-tiran',           name: 'Kul Tiran' },
    { slug: 'mechagnome',          name: 'Mechagnome' },
  ],
  horde: [
    { slug: 'orc',                 name: 'Orc' },
    { slug: 'undead',              name: 'Undead' },
    { slug: 'tauren',              name: 'Tauren' },
    { slug: 'troll',               name: 'Troll' },
    { slug: 'blood-elf',           name: 'Blood Elf' },
    { slug: 'goblin',              name: 'Goblin' },
    { slug: 'nightborne',          name: 'Nightborne' },
    { slug: 'highmountain-tauren', name: 'Highmountain Tauren' },
    { slug: 'mag-har-orc',         name: "Mag'har Orc" },
    { slug: 'zandalari-troll',     name: 'Zandalari Troll' },
    { slug: 'vulpera',             name: 'Vulpera' },
  ],
  neutral: [
    { slug: 'pandaren', name: 'Pandaren' },
    { slug: 'dracthyr', name: 'Dracthyr' },
    { slug: 'earthen',  name: 'Earthen' },
    { slug: 'haranir',  name: 'Haranir' },
  ],
}
