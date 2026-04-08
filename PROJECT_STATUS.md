# Whispers Census — Status

**Last Updated**: 2026-04-08
**Stage**: Phase 2 complete + spec data live, GitHub Actions automation set up

## What's Built
- Full Python crawler pipeline: OAuth → Blizzard API → Supabase upsert → aggregation → Vercel Blob export
- Supabase schema deployed (`001_initial_schema.sql` + `002_mplus_aggregator.sql`)
- Reference data seeded (13 classes, 40 specs, 31+ races, all US realms)
- **Phase 1 (PvP)**: Season 41 US crawl complete — 151,717 characters in blob
- **Phase 2 (M+)**: Full leaderboard crawl complete — 230k runs, 1.1M members, 198,429 characters in blob
- **Spec data**: Blob now includes `specs` (40 spec rows) and `spec_combos` (820-831 rows) per context
- Frontend React SPA with Vite + Tailwind (Yogg-Saron void theme)
- Core visualization components: `RaceClassHeatmap`, `PopularityBars` (By Class/Race/Spec), `ComboExplorer`
- Context-aware info panels in `ContextSelector` — plain-language dataset descriptions + methodology
- `useDemographics.js` — returns `data`, `specData`, `specCombos`; module-level caching
- Favicon + logo (frontend/public/)
- Deployed: whisperscensus.com (manual `npx vercel --prod` from frontend/)
- **GitHub Actions**: `jckznb/whispers-census-crawler` public repo — PvP (Tue), M+ (Wed) weekly automated crawls; census stub ready

## What's Planned / TODO

### Immediate
- [ ] Verify first automated PvP Actions run completes successfully
- [ ] Run M+ Actions workflow manually to validate
- [ ] Remove dead code: `@supabase/supabase-js` dep, `supabaseClient.js`, `FilterPanel.jsx`

### Phase 3 (General Census)
- [ ] Implement `crawler/census.py` — guild roster snowball seeded from M+/PvP characters + raid guild rosters
- [ ] Uncomment schedule in `census-crawl.yml` once crawler is ready
- [ ] Frontend `general` tab already exists (disabled, phase 3)

### Nice to Have (deferred)
- [ ] `TrendChart.jsx` — historical snapshots over time
- [ ] EU region support
- [ ] Error boundary in React
- [ ] Connect GitHub → Vercel for auto-deploy (currently manual CLI)
- [ ] Any automated tests

## Architecture Notes
- Vercel Blob URL: `https://hcuvha7imwqra4ww.public.blob.vercel-storage.com/demographics.json`
- `VITE_DEMOGRAPHICS_URL` set in Vercel project env (Production only)
- Blob shape: `{ updated, pvp/pve/general: { total, combos, specs, spec_combos } }`
- M+ aggregation uses `SET LOCAL statement_timeout = '300s'` to bypass Supabase's default limit
- Member deletes chunked at 200/batch to avoid PostgREST URL length limits
- Crawler lives in separate public repo (`whispers-census-crawler`) for unlimited Actions minutes
- Raid data not exposed as its own tab — leaderboard returns guild refs, not characters; feeds general census instead
