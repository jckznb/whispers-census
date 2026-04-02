# Whispers Census — Status

**Last Updated**: 2026-04-01
**Stage**: Early Dev (Phase 1 feature-complete, not yet deployed)

## What's Built
- Full Python crawler pipeline: OAuth → Blizzard API → Supabase upsert → aggregation → Vercel Blob export
- Supabase schema deployed (all tables, indexes, RLS, RPC functions via `001_initial_schema.sql`)
- Reference data seeded (13 classes, 40 specs, 31 races, all US realms)
- First PvP crawl run against Season 41 US (was running/just completed as of 2026-03-31)
- Frontend React SPA with Vite + Tailwind (Yogg-Saron theme)
- Core visualization components: `RaceClassHeatmap`, `PopularityBars`, `ComboExplorer`
- `useDemographics.js` hook — fetches pre-aggregated blob, module-level caching
- Architecture upgraded to Vercel Blob static JSON (zero direct Supabase connections from frontend)

## What's In Progress
- **PvP crawl may still be finishing** — profile lookups are slow (~1 req/s due to rate limiting on Season 41 + Blitz brackets)
- **Blob URL pending** — first export prints the URL to console; not yet captured and set as `VITE_DEMOGRAPHICS_URL`
- **Deployment pending** — no git repo, no Vercel project connected yet

## What's Planned / TODO

### Immediate (to launch Phase 1)
- [ ] Confirm crawl completed; grab blob URL from console
- [ ] Set `VITE_DEMOGRAPHICS_URL` in `frontend/.env` and Vercel dashboard
- [ ] `git init` + push to GitHub (new repo)
- [ ] Connect to Vercel, set root dir to `frontend/`, deploy
- [ ] Remove dead code: `@supabase/supabase-js` dep, `supabaseClient.js`, `FilterPanel.jsx`

### Phase 2 (M+ & Raid)
- [ ] Implement `crawler/mythic_plus.py` (M+ leaderboard → character profiles)
- [ ] Implement `crawler/raid.py` (raid character participation)
- [ ] Update `compute_demographics_snapshot()` to include pve context
- [ ] Wire `run_crawl.py` to export after pve phases (not just pvp)
- [ ] Frontend `pve` tab already exists in ContextSelector

### Phase 3 (General Census)
- [ ] Design general population sampling approach
- [ ] Implement `crawler/census.py`
- [ ] Frontend `general` tab already exists

### Nice to Have (deferred)
- [ ] `TrendChart.jsx` — historical snapshots over time (needs multi-date blob strategy)
- [ ] Spec-level breakdown (currently collapsed to race+class only)
- [ ] EU region support (currently US only)
- [ ] Error boundary in React
- [ ] Accessibility (ARIA labels, semantic HTML)
- [ ] Any automated tests

## Blockers / Decisions Needed
- **Blob URL**: Must be captured from first export console output and set as env var before frontend can show real data
- **Git/Vercel setup**: No repo exists yet — decide on repo name and whether to include crawler + frontend in same repo or split
- **EU crawl**: Supabase schema supports `region` column but crawler only runs `--region us` so far; EU would double API calls and data volume
