# Whispers Census — Style Guide for Infographics

## Concept

Old Gods / Yogg-Saron void horror aesthetic applied to WoW data visualization.
Dark, cosmic, slightly ominous — but clean and readable. Think "ancient evil that
also does data analysis." The name "Whispers Census" comes from Yogg-Saron's
"whispers" mechanic in WotLK.

---

## Color Palette

### Void Scale (primary backgrounds + text)
| Name       | Hex       | Use                                      |
|------------|-----------|------------------------------------------|
| void-950   | `#06020d` | Page background (darkest)                |
| void-900   | `#0d0518` | Deep backgrounds, footer                 |
| void-800   | `#1a0a30` | Card backgrounds (with ~60% opacity)     |
| void-700   | `#261048` | Borders (with ~30–40% opacity), dividers |
| void-600   | `#3d1a6e` | Muted borders, scrollbar track           |
| void-500   | `#5c2d91` | Placeholder text, secondary labels       |
| void-400   | `#7c3aed` | Muted interactive text, footnotes        |
| void-300   | `#9b6dff` | Body text, secondary headings            |
| void-200   | `#b89dff` | Hover states                             |
| void-100   | `#d9ceff` | Primary body text                        |
| void-50    | `#f0ebff` | Brightest text (rare)                    |

### Yogg / Accent
| Name          | Hex       | Use                                             |
|---------------|-----------|-------------------------------------------------|
| yogg-purple   | `#9b4cc4` | Primary accent — buttons, active states, scrollbar hover |
| yogg-eye      | `#c084fc` | Highlight color — eye motif, focus rings, glow  |
| yogg-tentacle | `#4c1d95` | Dark purple accent                              |
| yogg-void     | `#1e0a3c` | Very dark purple, used in the eye loader        |

### Background
Radial gradient: `radial-gradient(ellipse at top, #1a0a30 0%, #06020d 70%)`
The top of the page blooms into deep purple, bleeding into near-black.

---

## WoW Class Colors

These are the official Blizzard UI colors. Use these when referencing specific classes.

| Class        | Hex       |
|--------------|-----------|
| Death Knight | `#C41E3A` |
| Demon Hunter | `#A330C9` |
| Druid        | `#FF7C0A` |
| Evoker       | `#33937F` |
| Hunter       | `#AAD372` |
| Mage         | `#3FC7EB` |
| Monk         | `#00FF98` |
| Paladin      | `#F48CBA` |
| Priest       | `#FFFFFF` |
| Rogue        | `#FFF468` |
| Shaman       | `#0070DD` |
| Warlock      | `#8788EE` |
| Warrior      | `#C69B3A` |

Dimmed/muted versions (for backgrounds behind colored elements) follow the same
hues at roughly 60% darkness — e.g. DK dim is `#7a1223`, Mage dim is `#267891`.

### Faction Colors
| Faction  | Hex       |
|----------|-----------|
| Alliance | `#1a6eb5` |
| Horde    | `#8c1c1c` |
| Neutral  | `#6b7280` |

---

## Typography

| Role             | Font                         | Notes                              |
|------------------|------------------------------|------------------------------------|
| Display / Titles | **Cinzel** (serif)           | All section headings, site title   |
| Body / UI        | **Inter** (sans-serif)       | Everything else                    |

- Site title: Cinzel, xl, semibold, `void-50`, letter-spacing wide, with eye glow
- Section titles: Cinzel, xl, semibold, `void-100`, tracking-wide
- Body text: Inter, sm–base, `void-100` / `void-300`
- Captions / metadata: Inter, xs, `void-400`–`void-500`
- Numbers / percentages: tabular-nums, usually `void-300`

**Eye glow effect** (used on the site title):
`text-shadow: 0 0 20px rgba(192,132,252,0.6), 0 0 40px rgba(156,76,196,0.3)`

---

## UI Components

### Cards
The primary container pattern. Used for every major section on the page.

```
background:    rgba(26, 10, 48, 0.60)   → void-800 at 60% opacity
border:        rgba(61, 26, 110, 0.30)  → void-600 at 30% opacity
border-radius: 12px (rounded-xl)
backdrop-blur: sm
```

Cards have comfortable padding (p-4 to p-6). They sit on top of the void gradient
and appear to float — no hard shadows, just the translucent blur effect.

### Header
Sticky top bar. Same translucent treatment as cards but spanning full width.
- `bg-void-900/80`, `backdrop-blur-md`, `border-b border-void-700/40`
- Left: logo (32×32 rounded-sm) + site title in Cinzel
- Right: tab switcher nav pill + snapshot date label

### Tab Switcher (nav pill)
```
background:    rgba(26, 10, 48, 0.60)   → void-800/60
border:        void-600/30
border-radius: 8px (rounded-lg)
padding:       4px

Active tab:    bg-yogg-purple/80, text-white
Inactive tab:  text-void-400, hover text-void-200
```

### Buttons

**Primary (`btn-primary`):**
`bg-yogg-purple` (#9b4cc4), white text, rounded-lg, hover → `bg-void-400`
Focus ring: `yogg-eye` (#c084fc)

**Ghost (`btn-ghost`):**
No background, `text-void-300`, hover `text-void-100` + `bg-void-700/50`

**Toggle pills (e.g. By Class / By Race / By Spec):**
Active: `bg-void-600/60 text-void-100`
Inactive: `text-void-500 hover:text-void-300`
Disabled: `text-void-600`, cursor not-allowed

### Loading State
Animated "eye" in the center of the page:
- Outer ring: `w-12 h-12` circle, `bg-yogg-purple/20`, `animate-ping`
- Inner circle: `bg-yogg-void`, `border-2 border-yogg-purple/50`
- Pupil: `w-4 h-4`, `bg-yogg-eye` (#c084fc), `animate-pulse`
- Label below: `text-void-400 text-sm` — "The whispers are gathering data…"

---

## Data Visualization

### Race × Class Heatmap
Grid of small colored cells (24×20px each). Class rows, race columns.
- Valid combo: colored button, opacity and background alpha encode popularity via `sqrt(count/max)`
- Invalid combo: flat gray div (`bg-void-950/50 opacity-20`)
- Selected cell: `ring-2 ring-yogg-eye` outline
- Cell color = class color with alpha channel encoding intensity

### Popularity Bars
Horizontal ranked bar chart.
- Bars: full-width rounded pill, `bg-void-800/50` track, class/faction/role color fill at 85% opacity
- Label left: colored name + optional meta subtitle in `void-500`
- Rank number: `text-void-500 text-xs`
- Percentage right: `text-void-300 text-xs tabular-nums`

### Combo Explorer
Filter-and-display panel. Dropdown selectors styled as `bg-void-800 border border-void-600/40 text-void-200 rounded-lg`.

---

## Infographic Recommendations

When making standalone infographics for this project:

1. **Background**: use the void radial gradient or a flat `#06020d` / `#0d0518`
2. **Containers**: dark translucent cards — `#1a0a30` at 60–80% opacity with a
   thin `#3d1a6e` border (try 1px at 30–40% opacity)
3. **Data labels**: Cinzel for headings, Inter for values
4. **Accents**: use `yogg-eye` (#c084fc) sparingly for highlights, callouts, or
   decorative eye motifs
5. **Class data**: always use the official class colors above — audiences recognize them
6. **Faction data**: Alliance blue `#1a6eb5`, Horde red `#8c1c1c`
7. **Avoid**: bright whites, warm tones, heavy drop shadows — keep it cold and cosmic
8. **Glow**: soft purple glow (`#c084fc` at low opacity) works well on titles or
   hero numbers to reinforce the void aesthetic

---

## Voice / Tone (for captions and copy)

- Dry, slightly ominous, matter-of-fact
- "The whispers reveal what Azeroth is playing"
- "The void has catalogued X characters"
- Reference Old Gods lore lightly — don't overdo it
- Data-first: the mystique is in the framing, not the text
