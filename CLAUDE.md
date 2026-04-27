# Whispers Census — CLAUDE.md

## Project Overview
WoW retail character demographics visualization app tracking race/class popularity across PvP, M+, and general population. Hobby project targeting altaholics/theorycrafters. All three data contexts are live.

**Domain:** whisperscensus.com (live and deployed)
**Deploy:** `git push origin master` — GitHub auto-deploys to Vercel (connected 2026-04-26)

## Tech Stack
- **Framework**: Next.js 16.2.4 / React 19.2.4, App Router, `output: 'export'` (static site)
- **Styling**: Tailwind CSS v4 — CSS-first config in `frontend/app/globals.css`
- **Fonts**: Cinzel (`font-display`) + Inter (`font-sans`) via `next/font/google`, CSS vars injected
- **Backend**: Python crawler (httpx + python-dotenv — no framework)
- **Database**: Supabase (PostgreSQL) — write path only; frontend never queries Supabase
- **CDN Data**: Vercel Blob — `demographics.json` for homepage; per-slug JSONs committed to repo for SEO pages
- **Hosting**: Vercel (static export from `frontend/out/`)

## Project Structure
```
whispers-census/
├── crawler/              # Python backend — Blizzard API → Supabase → Vercel Blob
├── scripts/
│   ├── run_crawl.py          # Orchestrator
│   ├── fetch_media.py        # Blizzard media API → frontend/data/media/*.json
│   └── generate_seo_data.py  # demographics blob → frontend/data/classes/*.json + races/*.json
├── frontend/
│   ├── app/
│   │   ├── layout.js         # Root layout — fonts, metadata, Analytics
│   │   ├── page.js           # Homepage — CensusApp + Browse grids (as children)
│   │   ├── sitemap.js        # /sitemap.xml — auto-generated from data files
│   │   └── [slug]/
│   │       ├── layout.js     # SEO page wrapper — SiteHeader + footer
│   │       └── page.js       # Dynamic route — fs.readFileSync at build time
│   ├── components/
│   │   ├── CensusApp.jsx     # Main app — accepts {children} for browse section slot
│   │   ├── SiteHeader.jsx    # Sticky header with Classes/Races dropdown navs
│   │   └── seo/              # ClassPageClient, RacePageClient, ContextToggle, PercentageBar, FactionBar
│   ├── data/
│   │   ├── media/            # classes.json, specs.json, races.json — icon URLs
│   │   ├── classes/          # 13 files — monk.json etc. — generated, committed to repo
│   │   └── races/            # 34 files — night-elf.json, pandaren.json etc.
│   └── utils/
│       ├── constants.js      # CLASS_COLORS, FACTION_COLORS, VALID_COMBOS, CONTEXTS
│       ├── seo-nav.js        # CLASS_NAV, RACE_NAV — source of truth for all nav/grids
│       └── pluralize.js      # pluralRace(), pluralClass()
```

## Development Commands

### Frontend
```bash
cd frontend
npm run dev      # Next.js dev server on localhost:5173 (launch.json)
npm run build    # Static export → out/
```

### Backend / Crawler
```bash
python -m scripts.run_crawl --phase pvp --region us
python -m scripts.fetch_media           # Refresh icon manifests
python -m scripts.generate_seo_data    # Regenerate SEO JSONs from blob — run after each crawl
```

## Architecture Notes

### Data Pipeline
```
Blizzard API → crawler → Supabase → blob export → homepage (runtime fetch)
                                                 → generate_seo_data.py → /data/classes,races/*.json (build-time)
```

- **Homepage** fetches `demographics.json` at runtime via `useDemographics.js` (`NEXT_PUBLIC_DEMOGRAPHICS_URL`)
- **SEO pages** (`/monk`, `/night-elf`, etc.) read committed JSON files at build time — no runtime fetch
- **`app/[slug]/page.js`** tries `data/classes/{slug}.json` first, then `data/races/{slug}.json`
- Blob JSON shape: `{ updated, general: { total, combos, specs, spec_combos }, rp: {...}, pvp: {...}, pve: {...} }` — 4 contexts; `rp` = RP realms only (Moon Guard / Wyrmrest Accord / Emerald Dream)

### Credential / Secret Files
- Root `.env` — `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `BLOB_READ_WRITE_TOKEN`
- `frontend/.env.local` — `NEXT_PUBLIC_DEMOGRAPHICS_URL`
- Both gitignored. `whispers-census-client.txt` / `whispers-census-supabase.txt` — setup notes, gitignored.

### Theme
Yogg-Saron / Old Gods: dark void purples, Cinzel display font. Tokens defined in `frontend/app/globals.css` under `@theme {}`. Component classes (`.card`, `.btn-primary`, `.section-title`, `.glow-eye`) in `@layer components`.

### SEO Pages
- 50 slug pages at root level: `/monk`, `/night-elf`, `/pandaren`, `/pandaren-horde`, etc.
- `generateStaticParams()` reads `data/classes/` and `data/races/` at build time
- `generateMetadata()` builds title/description from the JSON data
- Context toggle (General/PvP/Mythic+) is client-side — all three datasets passed as props at build time
- Breadcrumbs link "Classes" → `/#browse-classes`, "Races" → `/#browse-races`

## Known Issues / Tech Debt
- Race icons all `null` — Blizzard race media API returns 404; replace with Wowhead assets manually
- Class icons are low-res 56px JPGs — replace with higher-quality Wowhead assets
- Static content (racial abilities, lore blurbs, class overviews) not yet authored — sections omitted
- `@supabase/supabase-js` in `frontend/package.json` — dead dependency, safe to remove
- `generate_seo_data.py` not wired into `scripts/run_crawl.py` pipeline — run manually after crawls
- No automated tests configured
