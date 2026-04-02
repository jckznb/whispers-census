# Whispers Census — Architecture & Implementation Plan

## Project Overview

A web application that visualizes World of Warcraft character demographics — race, class, spec, and combo popularity — with heavy filtering by game context (PvP bracket, M+ key level, raid difficulty, level bracket). The core value proposition is answering "what's popular and what's rare" across different slices of the playerbase, with a focus on serving altaholics and theorycrafters.

**Name:** Whispers Census
**Domain:** whisperscensus.app (Vercel)
**Theme:** Old Gods / Yogg-Saron — "the whispers reveal what Azeroth is playing"
**Target:** Retail WoW only (US and EU regions to start)

---

## Phased Rollout

### Phase 1 — PvP Leaderboard Demographics
Smallest dataset, fastest to MVP. Pull rated PvP leaderboards and visualize race/class/spec distributions across brackets.

### Phase 2 — M+ and Raid Demographics
Add Mythic+ leaderboard data (top runs per realm/dungeon) and Mythic raid leaderboard data. Enables "what do people play in keys vs. raids vs. PvP" comparisons.

### Phase 3 — General Population Census
Slow-crawl the broader playerbase via auction house → guild roster snowball. Builds the baseline "what does the overall population look like" to contrast against endgame demographics.

---

## Data Sources (Blizzard API)

### Authentication
- Register at https://develop.battle.net to get client_id and client_secret
- Use OAuth 2.0 Client Credentials flow for all Game Data and Profile API access
- Token endpoint: `https://oauth.battle.net/token`
- Tokens expire (typically 24h) — cache and refresh automatically
- Rate limits for registered apps: ~100 requests/second, 36,000/hour (credit-based, varies by endpoint cost)

### Reference Data (Game Data APIs — `namespace=static-us`)
Pull once and cache. Refresh on major patches.

| Endpoint | Purpose | Data |
|----------|---------|------|
| `GET /data/wow/playable-race/index` | Race lookup table | ID → name, faction |
| `GET /data/wow/playable-class/index` | Class lookup table | ID → name |
| `GET /data/wow/playable-specialization/index` | Spec lookup table | ID → name, class, role |
| `GET /data/wow/realm/index` | Realm lookup table | ID → name, slug, connected realm |
| `GET /data/wow/connected-realm/index` | Connected realm mapping | Which realms share populations |

### Phase 1: PvP Leaderboards (`namespace=dynamic-us`)

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `GET /data/wow/pvp-season/index` | Get current PvP season ID | Check periodically |
| `GET /data/wow/pvp-season/{seasonId}/pvp-leaderboard/index` | List available brackets | Returns bracket slugs |
| `GET /data/wow/pvp-season/{seasonId}/pvp-leaderboard/{bracket}` | Leaderboard entries | Each entry has: character name, realm, faction, rank, rating, plus character race/class data accessible via linked profile |

**Brackets to pull:** `2v2`, `3v3`, `rbg`, `shuffle-{class}-{spec}` (solo shuffle has per-spec leaderboards)

**Character data from PvP leaderboard entries:** Each entry includes a character reference with realm slug and character name. To get race/class/spec, you need to hit the Character Profile Summary for each unique character:

`GET /profile/wow/character/{realmSlug}/{characterName}` (`namespace=profile-us`)

Returns: race (id + name), class (id + name), active_spec, gender, level, faction, equipped_item_level, etc.

**Optimization:** Many characters appear across multiple brackets. Deduplicate before making profile calls. For solo shuffle, the spec is implicit in the bracket slug, but you still need race.

**Estimated API calls per full PvP pull (one region):**
- ~5 bracket index calls
- ~30 solo shuffle bracket calls (one per spec)
- Each leaderboard returns up to 5,000 entries (paginated)
- Unique characters after dedup: estimate ~50,000-100,000
- Character profile calls: ~50,000-100,000
- Total: well within rate limits if spread over a few hours

### Phase 2: M+ and Raid Leaderboards

**Mythic Keystone Leaderboards:**

| Endpoint | Purpose |
|----------|---------|
| `GET /data/wow/connected-realm/{connectedRealmId}/mythic-leaderboard/index` | List dungeons with leaderboards for a connected realm |
| `GET /data/wow/connected-realm/{connectedRealmId}/mythic-leaderboard/{dungeonId}/period/{period}` | Top 500 runs for realm+dungeon+period |

Each run entry includes the full group (usually 5 characters) with realm and character name. Again, need profile lookups for race/class/spec, but heavy dedup helps.

**Estimated scale:** ~15-20 connected realms (US) × 8 dungeons × 500 runs × 5 players = ~300,000-400,000 character appearances, but with massive overlap. Unique characters probably ~100,000-200,000.

**Mythic Raid Leaderboards:**

| Endpoint | Purpose |
|----------|---------|
| `GET /data/wow/journal/instance/index` | Get current raid instance IDs |
| `GET /data/wow/mythic-raid-leaderboard/{raid}/{faction}` | Top guilds for the raid |

Smaller dataset. Returns guild references — need guild roster calls to get individual characters.

### Phase 3: General Population Census

**Discovery strategy (auction house → guild roster snowball):**

1. `GET /data/wow/connected-realm/{id}/auctions` — returns all current auction listings with seller character names
2. For each unique seller, get their guild: `GET /profile/wow/character/{realm}/{name}` → extract guild reference
3. For each unique guild, get the roster: `GET /data/wow/guild/{realmSlug}/{guildName}/roster` — returns all members with character name, realm, level, race, class, and playable_class info
4. For characters you want deeper data on (spec, item level, etc.): individual profile lookups

**The guild roster endpoint is the key efficiency win** — it returns race and class for every member in a single call, avoiding per-character lookups for basic demographic data.

**This phase is a slow, continuous crawl.** Run daily, discover new characters each cycle. Coverage improves over weeks/months.

---

## Data Model

### Core Tables

```sql
-- Reference tables (populated from Game Data API, refreshed on patches)
CREATE TABLE races (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    faction TEXT NOT NULL  -- 'alliance', 'horde', 'neutral'
);

CREATE TABLE classes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE specs (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    class_id INTEGER REFERENCES classes(id),
    role TEXT NOT NULL  -- 'tank', 'healer', 'dps'
);

CREATE TABLE realms (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    connected_realm_id INTEGER,
    region TEXT NOT NULL  -- 'us', 'eu'
);

-- Core character table
CREATE TABLE characters (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    realm_slug TEXT NOT NULL,
    region TEXT NOT NULL,
    race_id INTEGER REFERENCES races(id),
    class_id INTEGER REFERENCES classes(id),
    active_spec_id INTEGER REFERENCES specs(id),
    gender INTEGER,  -- 0=male, 1=female
    level INTEGER,
    faction TEXT,
    equipped_item_level INTEGER,
    last_api_update TIMESTAMPTZ NOT NULL,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, realm_slug, region)
);

CREATE INDEX idx_characters_race ON characters(race_id);
CREATE INDEX idx_characters_class ON characters(class_id);
CREATE INDEX idx_characters_spec ON characters(active_spec_id);
CREATE INDEX idx_characters_level ON characters(level);
CREATE INDEX idx_characters_faction ON characters(faction);

-- PvP context (Phase 1)
CREATE TABLE pvp_entries (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT REFERENCES characters(id),
    season_id INTEGER NOT NULL,
    bracket TEXT NOT NULL,  -- '2v2', '3v3', 'rbg', 'shuffle-warrior-arms', etc.
    rating INTEGER NOT NULL,
    rank INTEGER,
    snapshot_date DATE NOT NULL,
    UNIQUE(character_id, season_id, bracket, snapshot_date)
);

CREATE INDEX idx_pvp_bracket ON pvp_entries(bracket);
CREATE INDEX idx_pvp_rating ON pvp_entries(rating);
CREATE INDEX idx_pvp_snapshot ON pvp_entries(snapshot_date);

-- M+ context (Phase 2)
CREATE TABLE mythic_plus_runs (
    id BIGSERIAL PRIMARY KEY,
    dungeon_id INTEGER NOT NULL,
    dungeon_name TEXT,
    keystone_level INTEGER NOT NULL,
    completed_timestamp BIGINT,  -- epoch ms from API
    connected_realm_id INTEGER,
    period INTEGER NOT NULL,
    snapshot_date DATE NOT NULL
);

CREATE TABLE mythic_plus_members (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT REFERENCES mythic_plus_runs(id),
    character_id BIGINT REFERENCES characters(id),
    spec_id INTEGER REFERENCES specs(id)  -- spec at time of run if available
);

CREATE INDEX idx_mplus_keystone ON mythic_plus_runs(keystone_level);
CREATE INDEX idx_mplus_dungeon ON mythic_plus_runs(dungeon_id);
CREATE INDEX idx_mplus_period ON mythic_plus_runs(period);

-- Raid context (Phase 2)
CREATE TABLE raid_characters (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT REFERENCES characters(id),
    raid_name TEXT NOT NULL,
    difficulty TEXT NOT NULL,  -- 'mythic'
    guild_name TEXT,
    guild_realm_slug TEXT,
    rank INTEGER,  -- guild's world rank
    snapshot_date DATE NOT NULL
);

-- Crawl metadata (Phase 3)
CREATE TABLE crawl_state (
    id BIGSERIAL PRIMARY KEY,
    realm_slug TEXT NOT NULL,
    region TEXT NOT NULL,
    last_auction_crawl TIMESTAMPTZ,
    last_guild_crawl TIMESTAMPTZ,
    guilds_discovered INTEGER DEFAULT 0,
    characters_discovered INTEGER DEFAULT 0
);

-- Precomputed aggregation tables (refreshed after each data pull)
CREATE TABLE demographics_snapshot (
    id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    context TEXT NOT NULL,  -- 'pvp_2v2', 'pvp_3v3', 'pvp_shuffle', 'mplus_all', 'mplus_15plus', 'raid_mythic', 'general', etc.
    context_filter TEXT,    -- optional sub-filter: rating bracket, key level range, etc.
    region TEXT NOT NULL,
    race_id INTEGER REFERENCES races(id),
    class_id INTEGER REFERENCES classes(id),
    spec_id INTEGER REFERENCES specs(id),
    gender INTEGER,
    count INTEGER NOT NULL,
    percentage NUMERIC(5,2)
);

CREATE INDEX idx_demo_context ON demographics_snapshot(context, snapshot_date);
CREATE INDEX idx_demo_region ON demographics_snapshot(region);
```

---

## Tech Stack

### Priority: Keep monthly costs near zero. This is a hobby project.

| Component | Choice | Cost | Notes |
|-----------|--------|------|-------|
| **Database** | Supabase (Postgres) — Free tier | $0/mo | 500MB storage, unlimited API requests. More than enough for Phase 1-2. Has MCP integration for Claude Code. |
| **Data Crawler** | Python script on local machine / cron | $0 | Run from your laptop. No cloud compute needed for weekly batch pulls. |
| **Backend API** | None — frontend queries Supabase directly | $0 | Supabase JS client library handles auth and queries. Use Row Level Security (RLS) to make demographic tables publicly readable. No custom API server needed. |
| **Frontend** | React (Vite) on Vercel | $0 | Vercel free tier. Domain: whisperscensus.app ($15/yr). |
| **Domain** | whisperscensus.app via Vercel | $15/yr | .app TLD, HTTPS required by default. |

**Total estimated cost: ~$1.25/month** (just the domain)

### Supabase Configuration

**Project setup:**
- Create a Supabase project (free tier)
- Region: pick closest to you for crawler write latency (frontend reads are fast regardless)
- The free tier pauses the DB after 7 days of inactivity — weekly crawl runs keep it alive

**Row Level Security (RLS):**
- Enable RLS on all tables
- Public read policy on: `races`, `classes`, `specs`, `realms`, `demographics_snapshot`, `pvp_entries`, `mythic_plus_runs`, `mythic_plus_members`, `raid_characters`, `characters`
- Write access restricted to service_role key (used only by the crawler, never exposed to frontend)
- `crawl_state` table: no public access (internal crawler use only)

```sql
-- Example RLS policies
ALTER TABLE demographics_snapshot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON demographics_snapshot FOR SELECT USING (true);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON characters FOR SELECT USING (true);

-- Repeat for all public-facing tables
```

**Frontend access:**
- Use Supabase JS client with the `anon` key (safe to expose, RLS controls access)
- Query demographics_snapshot with filters directly from React components
- Supabase handles connection pooling, caching, etc.

**Crawler access:**
- Use `supabase-py` (Python client) with the `service_role` key (stored in .env, never committed)
- Service role bypasses RLS for write operations
- Bulk upserts via `supabase.table('characters').upsert(batch_data)`

### Future Scale-Up Path
If the project takes off:
1. Supabase Pro tier ($25/mo) for 8GB storage, daily backups, no pause
2. Add Supabase Edge Functions if you need server-side compute
3. Add Vercel Edge Middleware for caching hot queries
4. Consider migrating crawler to a scheduled cloud function (Lambda/Cloud Run) so it doesn't depend on your laptop

---

## Crawler Design

### `crawler.py` — Main orchestrator

```
whispers-census/
├── crawler/
│   ├── __init__.py
│   ├── config.py          # API credentials, region config, rate limit settings
│   ├── auth.py            # OAuth token management (get, cache, refresh)
│   ├── client.py          # Blizzard API HTTP client with rate limiting and retries
│   ├── reference.py       # Fetch and cache reference data (races, classes, specs, realms)
│   ├── pvp.py             # Phase 1: PvP leaderboard crawler
│   ├── mythic_plus.py     # Phase 2: M+ leaderboard crawler
│   ├── raid.py            # Phase 2: Raid leaderboard crawler
│   ├── census.py          # Phase 3: AH → guild roster snowball crawler
│   ├── characters.py      # Character profile lookup with dedup and batching
│   ├── aggregator.py      # Compute demographics_snapshot from raw data
│   └── db.py              # Supabase client wrapper (reads/writes via supabase-py)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── supabaseClient.js          # Supabase JS client init (anon key)
│   │   ├── components/
│   │   │   ├── RaceClassHeatmap.jsx    # Core visualization: race × class grid
│   │   │   ├── ContextSelector.jsx     # PvP / M+ / Raid / General toggle
│   │   │   ├── FilterPanel.jsx         # Rating range, key level, etc.
│   │   │   ├── PopularityBars.jsx      # Horizontal bar charts for rankings
│   │   │   ├── ComboExplorer.jsx       # "Pick a race, see class distribution" interactive
│   │   │   └── TrendChart.jsx          # Historical popularity over snapshots
│   │   ├── hooks/
│   │   │   └── useDemographics.js      # Custom hook: query Supabase for demographic data
│   │   └── utils/
│   │       └── constants.js            # Race/class names, color mappings, WoW class colors
│   ├── public/
│   │   └── favicon.ico
│   └── package.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # Full schema (runs via Supabase CLI or dashboard)
├── scripts/
│   ├── run_crawl.py       # CLI entry point: `python -m scripts.run_crawl --phase pvp --region us`
│   ├── aggregate.py       # CLI: recompute demographics_snapshot
│   └── seed_reference.py  # CLI: populate races/classes/specs/realms from Blizzard API
├── requirements.txt       # supabase, httpx, python-dotenv, etc.
├── .env                   # BLIZZARD_CLIENT_ID, BLIZZARD_CLIENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY (gitignored)
├── .env.example           # Template with placeholder values
└── README.md
```

### Crawler Behavior

**Rate limiting:** Implement a token bucket or simple sleep-based throttle. Target 50 req/sec to stay safely under limits with headroom.

**Retry logic:** Exponential backoff on 429 (rate limited) and 5xx errors. Skip and log on 404 (character transferred/deleted).

**Deduplication:** Before making character profile API calls, check if the character already exists in DB with a recent `last_api_update`. Skip if updated within the last 24h (configurable staleness threshold).

**Incremental crawling:** Track crawl state so interrupted runs can resume. For PvP, track which brackets have been pulled for the current snapshot date.

**Scheduling:**
- Phase 1: Run PvP crawl weekly (leaderboards shift slowly) or daily if you want tighter trending data
- Phase 2: Run M+ crawl weekly (aligned with weekly reset). Raid crawl less frequently (monthly).
- Phase 3: Run census crawl continuously in small batches (e.g., 2-3 realms per day)

---

## API Design

### `GET /api/demographics`

Main query endpoint. Returns aggregated counts and percentages.

**Query parameters:**
- `context` (required): `pvp_2v2`, `pvp_3v3`, `pvp_rbg`, `pvp_shuffle`, `mplus`, `raid_mythic`, `general`
- `group_by` (required): `race`, `class`, `spec`, `race_class`, `race_spec`
- `region`: `us`, `eu`, `all` (default: `all`)
- `faction`: `alliance`, `horde`, `all` (default: `all`)
- `min_rating`: integer (PvP contexts only)
- `max_rating`: integer (PvP contexts only)
- `min_key_level`: integer (M+ context only)
- `max_key_level`: integer (M+ context only)
- `min_level`: integer (general context only)
- `max_level`: integer (general context only)
- `race_id`: integer (filter to specific race — "show me class distribution for Dwarves")
- `class_id`: integer (filter to specific class — "show me race distribution for Druids")
- `snapshot_date`: date (default: latest)

**Since the frontend queries Supabase directly, these translate to Supabase JS queries:**

```javascript
// Example: Race distribution in PvP shuffle, 1800+ rating, US region
const { data, error } = await supabase
  .from('demographics_snapshot')
  .select('*')
  .eq('context', 'pvp_shuffle')
  .eq('region', 'us')
  .gte('context_filter', '1800')  // or use a dedicated rating column
  .order('count', { ascending: false });
```

**For complex queries not covered by the precomputed snapshots, use Supabase RPC (Postgres functions):**

```sql
-- Example: compute race/class combo distribution on the fly from raw pvp_entries
CREATE OR REPLACE FUNCTION get_pvp_demographics(
  p_bracket TEXT,
  p_min_rating INTEGER DEFAULT 0,
  p_region TEXT DEFAULT 'all'
)
RETURNS TABLE (race_name TEXT, class_name TEXT, spec_name TEXT, char_count BIGINT, pct NUMERIC)
AS $$
  SELECT r.name, c.name, s.name, COUNT(*) as char_count,
         ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as pct
  FROM pvp_entries pe
  JOIN characters ch ON pe.character_id = ch.id
  JOIN races r ON ch.race_id = r.id
  JOIN classes c ON ch.class_id = c.id
  LEFT JOIN specs s ON ch.active_spec_id = s.id
  WHERE pe.bracket = p_bracket
    AND pe.rating >= p_min_rating
    AND (p_region = 'all' OR ch.region = p_region)
    AND pe.snapshot_date = (SELECT MAX(snapshot_date) FROM pvp_entries)
  GROUP BY r.name, c.name, s.name
  ORDER BY char_count DESC;
$$ LANGUAGE sql STABLE;
```

```javascript
// Frontend calls it like:
const { data } = await supabase.rpc('get_pvp_demographics', {
  p_bracket: 'shuffle',
  p_min_rating: 1800,
  p_region: 'us'
});
```

**Approach:** Use the precomputed `demographics_snapshot` table for fast common queries, and RPC functions for custom/complex filters. The aggregator script refreshes snapshots after each crawl.

---

## Frontend Core Views

### 1. Race × Class Heatmap (Hero View)
A grid with races on one axis and classes on the other. Cell color intensity = popularity. Cells are clickable to drill into spec breakdown. Empty cells (invalid combos) are grayed out. Context selector at the top switches the underlying dataset.

### 2. "What's Rare?" Explorer
Pick a race OR a class. See sorted bars for the other dimension, with the least popular combos highlighted. Toggle between different game contexts to see how rarity shifts. This is the altaholic's primary tool.

### 3. Context Comparison
Side-by-side or overlaid charts showing how the same race/class/combo ranks differently in PvP vs M+ vs raids vs general pop. Highlights interesting divergences (e.g., "this combo is 2% of general pop but 8% of high-rated PvP").

### 4. Trend Over Time (Phase 2+)
Once you have multiple snapshots, show how popularity shifts across patches/seasons.

---

## Deployment

### Development
1. Set up Supabase project, run migration SQL in dashboard or via Supabase CLI
2. Populate reference data: `python -m scripts.seed_reference`
3. Run first PvP crawl: `python -m scripts.run_crawl --phase pvp --region us`
4. Frontend dev: `cd frontend && npm run dev` (queries Supabase directly)

### Production
1. Frontend auto-deploys from Git repo via Vercel
2. Configure whisperscensus.app domain in Vercel dashboard
3. Environment variables in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Crawler runs locally on your machine (weekly cron or manual trigger)
5. Supabase handles all data serving — no API server to maintain

### Crawler Scheduling
For now, run manually or via local cron:
```bash
# Weekly PvP crawl (e.g., every Tuesday after reset)
0 12 * * 2 cd ~/whispers-census && python -m scripts.run_crawl --phase pvp --region us
```

If you want to stop depending on your laptop being on:
- GitHub Actions (free tier: 2,000 min/month) — run crawler as a scheduled workflow
- This is probably the best "next step" automation before going full cloud

---

## Implementation Order for Claude Code

### Sprint 0: Project Bootstrap
- [ ] Initialize project structure (directories, package.json, requirements.txt)
- [ ] Set up .env handling for Blizzard API credentials and Supabase keys
- [ ] Create Supabase project, run initial migration (001_initial_schema.sql)
- [ ] Set up Row Level Security policies (public read on all data tables)
- [ ] Implement OAuth token management (auth.py)
- [ ] Implement base Blizzard API client with rate limiting and retries (client.py)
- [ ] Implement Supabase client wrapper for crawler writes (db.py)
- [ ] Implement reference data fetcher and seeder (reference.py, seed_reference.py) — races, classes, specs, realms
- [ ] Set up frontend project (Vite + React + Tailwind)
- [ ] Configure Supabase JS client in frontend (supabaseClient.js)

### Sprint 1: PvP Crawler (Phase 1 Core)
- [ ] Implement PvP season and bracket discovery (pvp.py)
- [ ] Implement PvP leaderboard fetching with pagination
- [ ] Implement character profile fetcher with deduplication (characters.py)
- [ ] Wire up: crawl PvP → resolve characters → upsert to Supabase
- [ ] Implement aggregator: compute demographics_snapshot from raw PvP data (aggregator.py)
- [ ] Create Postgres RPC functions for dynamic queries
- [ ] Test with a single bracket (e.g., 3v3 US) end-to-end

### Sprint 2: Frontend MVP
- [ ] Set up React project with Vite + Tailwind + Old Gods visual theme (dark purples, void aesthetics, eye motifs)
- [ ] Implement useDemographics hook (queries Supabase, handles loading/error states)
- [ ] Build ContextSelector component (PvP bracket picker)
- [ ] Build PopularityBars component (sorted horizontal bars with WoW class colors)
- [ ] Build RaceClassHeatmap component
- [ ] Build ComboExplorer ("pick race, see classes" / "pick class, see races" interactive)
- [ ] Build FilterPanel (rating range slider for PvP)
- [ ] Wire up all components to live Supabase data
- [ ] Deploy to Vercel, configure whisperscensus.app domain
- [ ] Add "Data provided by Blizzard Entertainment" attribution (required by TOS)

### Sprint 3: M+ and Raid (Phase 2)
- [ ] Implement M+ leaderboard crawler (mythic_plus.py)
- [ ] Implement raid leaderboard crawler (raid.py)
- [ ] Extend aggregator for M+ and raid contexts
- [ ] Extend frontend context selector and filters (key level ranges)
- [ ] Add context comparison view

### Sprint 4: Polish and Census Prep (Phase 3 Foundation)
- [ ] Implement auction house → guild roster discovery (census.py)
- [ ] Implement crawl state tracking for incremental crawling
- [ ] Add "general population" context to frontend
- [ ] Add trend-over-time charts (multiple snapshots)
- [ ] Add meta page (data freshness, coverage stats)
- [ ] SEO basics, social sharing cards, favicon, etc.

---

## Blizzard API TOS Notes

- Register your application at https://develop.battle.net
- You must attribute Blizzard: display "Data provided by Blizzard Entertainment" with their logo
- Don't sell the raw API data itself — your value-add is the aggregation and visualization
- Don't use the API in a way that could harm Blizzard's services (respect rate limits)
- Review full terms at https://www.blizzard.com/en-us/legal/a2989b50-5f16-43b1-abec-2ae17cc09dd6/blizzard-developer-api-terms-of-use
- Ads on fan sites are generally accepted practice in the WoW ecosystem

---

## Decisions Made

1. **Project name:** Whispers Census (whisperscensus.app) — Old Gods / Yogg-Saron theme
2. **Database:** Supabase (Postgres) — free tier, frontend queries directly via JS client
3. **Frontend:** React (Vite + Tailwind) on Vercel
4. **Scope:** Retail WoW only, US region to start
5. **Phase order:** PvP first (smallest dataset) → M+ and Raid → General census crawl
6. **Cost target:** ~$0/month operational + $15/yr domain

## Open Questions / Decisions Still To Make

1. **EU data:** Add EU region in Phase 1 or wait? Doubles crawl work but broadens audience.
2. **How often to snapshot PvP data?** Weekly aligns with arena resets. Daily gives better trending but more storage.
3. **Visual theme details:** Dark void/Old God aesthetic is decided, but specifics (color palette, fonts, tentacle density) TBD during frontend sprint.
4. **GitHub Actions for crawler?** Could automate crawl runs for free instead of relying on local cron. Worth setting up in Sprint 1 or defer?
