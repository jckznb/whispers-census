# Whispers Census — CLAUDE.md

## Project Overview
WoW retail character demographics visualization app tracking race/class popularity across PvP, M+, raid, and general population. Hobby project targeting altaholics/theorycrafters who want to know what's popular vs. rare. Phase 1 (PvP) is largely complete; Phases 2–3 are stubbed.

**Domain:** whisperscensus.app (Vercel — not yet deployed as of 2026-04-01)

## Tech Stack
- **Framework**: React 18 + Vite (SPA, not Next.js)
- **Styling**: Tailwind CSS v3 with custom Yogg-Saron/Old Gods void theme
- **Backend**: Python crawler (httpx + python-dotenv — no framework)
- **Database**: Supabase (PostgreSQL) — write path only; no direct frontend queries
- **CDN Data**: Vercel Blob — crawler exports pre-aggregated JSON, frontend fetches once
- **Hosting**: Vercel (frontend + blob storage)
- **Key Dependencies**: recharts (charts), httpx (Python HTTP client)

## Project Structure
```
whispers-census/
├── crawler/          # Python backend — Blizzard API → Supabase → Vercel Blob
├── scripts/          # CLI entry points (run_crawl, aggregate, seed_reference)
├── supabase/
│   └── migrations/   # 001_initial_schema.sql — full DB schema (run once)
└── frontend/
    └── src/
        ├── components/   # RaceClassHeatmap, PopularityBars, ComboExplorer, etc.
        ├── hooks/        # useDemographics.js — fetches blob, module-scoped cache
        └── utils/        # constants.js — CONTEXTS, CLASS_COLORS, VALID_COMBOS
```

## Development Commands

### Frontend
```bash
cd frontend
npm run dev      # Vite dev server on localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

### Backend / Crawler
```bash
# Seed reference data (run once after DB migration)
python -m scripts.seed_reference --region us

# Run PvP crawl + aggregate + export blob
python -m scripts.run_crawl --phase pvp --region us

# Options: --no-aggregate, --no-export
```

## Architecture Notes

### Data Pipeline
```
Blizzard API → Python crawler → Supabase (raw data) → compute_demographics_snapshot() → Vercel Blob JSON → Frontend fetch
```

- **Frontend never touches Supabase directly.** All data arrives as a single pre-aggregated JSON blob (~5–10KB) from Vercel Blob CDN.
- Blob JSON shape: `{ updated, pvp: { total, combos: [{race, faction, class, count, pct}] }, pve, general }`
- `useDemographics.js` uses module-scoped `_cache` + `_inflight` to prevent duplicate fetches.
- `VITE_DEMOGRAPHICS_URL` env var points to the blob URL (set after first export).

### Supabase Usage
- **Backend only** — service key used for writes from the crawler.
- `crawler/db.py` calls the PostgREST REST API via httpx (no supabase-py — dropped due to Python 3.14 build issues).
- API keys are new-format `sb_secret_...` (not legacy `eyJ` JWT format).
- RLS enabled on all tables; public read-only policies on data tables.

### Credential / Secret Files
- Root `.env` — `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `BLOB_READ_WRITE_TOKEN`
- `frontend/.env` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (unused), `VITE_DEMOGRAPHICS_URL`
- Both `.env` files are gitignored.
- `whispers-census-client.txt` — Blizzard API setup notes (gitignored via `*.txt`)
- `whispers-census-supabase.txt` — Supabase setup notes (gitignored via `*.txt`)

### Theme
Yogg-Saron / Old Gods: dark void purples (`void-400` to `void-900`), Cinzel font (display), Inter (body). Defined in `frontend/tailwind.config.js`.

## Known Issues / Tech Debt
- `@supabase/supabase-js` is installed in `frontend/package.json` but **never used** — dead dependency, safe to remove along with `supabaseClient.js`
- `FilterPanel.jsx` is a stub component that is not rendered anywhere
- No git repo initialized yet — project lives only on local disk
- No automated tests (no jest/vitest/playwright configured)
- No error boundary in React (unhandled runtime errors will blank the page)
- `TrendChart.jsx` exists but is deferred (no historical data yet; component not rendered in App.jsx)

## Active Context
Phase 1 PvP crawl has run (possibly still completing as of last session). Next steps are:
1. Confirm crawl finished, grab the Vercel Blob URL from console output
2. Set `VITE_DEMOGRAPHICS_URL` in `frontend/.env` and Vercel project env vars
3. `git init` in project root, push to GitHub
4. Connect to Vercel (set root directory to `frontend/`), deploy
