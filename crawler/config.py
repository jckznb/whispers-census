import os
from dotenv import load_dotenv

load_dotenv()

# Optional at import time — only required when making Blizzard API calls.
# Using .get() so aggregate/export jobs can import config without Blizzard creds.
BLIZZARD_CLIENT_ID = os.environ.get('BLIZZARD_CLIENT_ID', '')
BLIZZARD_CLIENT_SECRET = os.environ.get('BLIZZARD_CLIENT_SECRET', '')

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_KEY']

BLOB_READ_WRITE_TOKEN = os.environ.get('BLOB_READ_WRITE_TOKEN', '')

REGIONS = ['us']  # Add 'eu' in Phase 2

BLIZZARD_TOKEN_URL = 'https://oauth.battle.net/token'
BLIZZARD_API_BASE = {
    'us': 'https://us.api.blizzard.com',
    'eu': 'https://eu.api.blizzard.com',
}

# Stay safely under 100 req/s Blizzard rate limit
RATE_LIMIT_RPS = 50

# Skip character profile lookups if updated more recently than this
STALENESS_HOURS = 24

# Targeted realms for the general population census.
# Two clusters chosen for distinct community character:
#
#   rp      — dedicated RP servers; skews toward casual/social playstyle
#               Moon Guard, Wyrmrest Accord, Emerald Dream
#
#   general — the ten highest-population US realms; broad cross-section
#               of the active playerbase weighted toward Horde (Area 52,
#               Illidan, Mal'Ganis dominate US pop rankings)
#               Illidan, Area 52, Mal'Ganis, Zul'jin, Tichondrius,
#               Stormrage, Thrall, Ragnaros, Azralon
#               + one TBD slot (see FIXME below)
#
# Slugs must match the Blizzard API realm slug format exactly.
# Verify unknown slugs via: GET /data/wow/realm/{slug}?namespace=dynamic-us
CENSUS_TARGET_REALMS: dict[str, list[str]] = {
    'rp': [
        'moon-guard',
        'wyrmrest-accord',
        'emerald-dream',
    ],
    'general': [
        'illidan',
        'area-52',
        'malganis',    # Mal'Ganis
        'zuljin',      # Zul'jin
        'tichondrius',
        'stormrage',
        'sargeras',    # Sargeras
        'thrall',
        'ragnaros',    # Latin America
        'azralon',     # Latin America
    ],
}

# Skip profession re-fetches for characters that already have a profession
# snapshot within this many days. Profession choices are stable mid-season,
# so weekly is fine. This prevents re-fetching ~150k profession endpoints
# every time the crawler runs (since all characters are always profile-stale).
PROFESSION_STALENESS_DAYS = 7
