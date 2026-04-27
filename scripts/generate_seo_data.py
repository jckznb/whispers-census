"""
Generate per-slug SEO data JSON files for all class and race pages.

Reads the pre-aggregated demographics blob from Vercel Blob CDN and produces:
  frontend/data/classes/{slug}.json   — one per class (13 total)
  frontend/data/races/{slug}.json     — one per race slug (~34 total, including
                                        neutral-race faction variants and
                                        disambiguation pages)

Run after a successful crawl export (or whenever the blob is updated).

Usage:
  python -m scripts.generate_seo_data
  python -m scripts.generate_seo_data --blob-url https://...

Env vars (checked in order):
  NEXT_PUBLIC_DEMOGRAPHICS_URL   in frontend/.env or frontend/.env.local
  DEMOGRAPHICS_URL               in root .env (alias if you prefer)
"""
import argparse
import json
import logging
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

import httpx
from dotenv import load_dotenv

# Load root .env, then frontend/.env.local so NEXT_PUBLIC_* vars are visible
_ROOT = Path(__file__).parent.parent
load_dotenv(_ROOT / '.env')
load_dotenv(_ROOT / 'frontend' / '.env.local', override=False)
load_dotenv(_ROOT / 'frontend' / '.env', override=False)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

# Output directories
OUTPUT_ROOT = _ROOT / 'frontend' / 'data'
CLASSES_DIR = OUTPUT_ROOT / 'classes'
RACES_DIR   = OUTPUT_ROOT / 'races'

# Blob context key  →  output context key  (pve = Mythic+ in the UI)
CONTEXT_KEY_MAP: dict[str, str] = {
    'general': 'general',
    'pvp':     'pvp',
    'pve':     'mythic',
}

# Neutral races — each gets base slug + -alliance/-horde + disambiguation page
NEUTRAL_RACE_NAMES: frozenset[str] = frozenset({'Pandaren', 'Dracthyr', 'Earthen', 'Haranir'})

# Faction for every faction-locked race (used when the combo row lacks faction)
RACE_FACTION: dict[str, str] = {
    # Alliance
    'Human':               'alliance',
    'Dwarf':               'alliance',
    'Night Elf':           'alliance',
    'Gnome':               'alliance',
    'Draenei':             'alliance',
    'Worgen':              'alliance',
    'Void Elf':            'alliance',
    'Lightforged Draenei': 'alliance',
    'Dark Iron Dwarf':     'alliance',
    'Kul Tiran':           'alliance',
    'Mechagnome':          'alliance',
    # Horde
    'Orc':                 'horde',
    'Undead':              'horde',
    'Tauren':              'horde',
    'Troll':               'horde',
    'Blood Elf':           'horde',
    'Goblin':              'horde',
    'Nightborne':          'horde',
    'Highmountain Tauren': 'horde',
    "Mag'har Orc":         'horde',
    'Zandalari Troll':     'horde',
    'Vulpera':             'horde',
}


# ── Shared helpers ─────────────────────────────────────────────────────────────

def slugify(name: str) -> str:
    """'Mag'har Orc' → 'mag-har-orc', 'Night Elf' → 'night-elf'."""
    s = name.lower()
    s = re.sub(r"['\u2019]", '-', s)   # apostrophe → hyphen
    s = re.sub(r'[^a-z0-9]+', '-', s)  # remaining non-alnum → hyphen
    return s.strip('-')


def race_slug(race_name: str, faction: str) -> str:
    """Return the correct URL slug for a race+faction combo.

    Neutral races:      pandaren + horde  → 'pandaren-horde'
    Faction-locked:     Blood Elf + horde → 'blood-elf'
    """
    base = slugify(race_name)
    return f'{base}-{faction}' if race_name in NEUTRAL_RACE_NAMES else base


def race_display_name(race_name: str, faction: str) -> str:
    """'Pandaren', 'horde' → 'Pandaren (Horde)'.  Faction-locked races unchanged."""
    if race_name in NEUTRAL_RACE_NAMES:
        return f'{race_name} ({faction.capitalize()})'
    return race_name


def class_slug(class_name: str) -> str:
    return slugify(class_name)


# ── Blob fetch ─────────────────────────────────────────────────────────────────

def fetch_blob(url: str) -> dict:
    logger.info(f'Fetching demographics blob: {url}')
    r = httpx.get(url, timeout=30, follow_redirects=True)
    r.raise_for_status()
    data = r.json()
    contexts = [k for k in data if k != 'updated']
    logger.info(f"  updated={data.get('updated')}  contexts={contexts}")
    return data


# ── Class data ─────────────────────────────────────────────────────────────────

def _class_context(combos: list[dict], spec_combos: list[dict], class_name: str) -> dict:
    """Races, specs, and factionSplit for one class in one context."""
    class_combos = [c for c in combos if c['class'] == class_name]
    total = sum(c['count'] for c in class_combos)
    if total == 0:
        return {'races': [], 'specs': [], 'factionSplit': {'alliance': 0.0, 'horde': 0.0}}

    # Races — normalised within the class
    race_counts: dict[str, int] = defaultdict(int)
    race_labels: dict[str, str] = {}
    for c in class_combos:
        slug = race_slug(c['race'], c['faction'])
        race_counts[slug] += c['count']
        race_labels.setdefault(slug, race_display_name(c['race'], c['faction']))

    races_list = [
        {
            'slug':       slug,
            'name':       race_labels[slug],
            'percentage': round(count * 100.0 / total, 2),
        }
        for slug, count in sorted(race_counts.items(), key=lambda x: -x[1])
    ]

    # Faction split
    faction_counts: dict[str, int] = defaultdict(int)
    for c in class_combos:
        faction = c.get('faction') or RACE_FACTION.get(c['race'], '')
        if faction in ('alliance', 'horde'):
            faction_counts[faction] += c['count']
    fc_total = sum(faction_counts.values())
    faction_split = {
        'alliance': round(faction_counts['alliance'] / fc_total, 4) if fc_total else 0.0,
        'horde':    round(faction_counts['horde']    / fc_total, 4) if fc_total else 0.0,
    }

    # Specs — from spec_combos, normalised within the class
    specs_list: list[dict] = []
    if spec_combos:
        class_sc = [s for s in spec_combos if s['class'] == class_name]
        spec_agg: dict[str, int] = defaultdict(int)
        for s in class_sc:
            spec_agg[s['spec']] += s['count']
        sc_total = sum(spec_agg.values())
        if sc_total > 0:
            specs_list = sorted(
                [
                    {'name': spec, 'percentage': round(cnt * 100.0 / sc_total, 2)}
                    for spec, cnt in spec_agg.items()
                ],
                key=lambda x: -x['percentage'],
            )

    return {'races': races_list, 'specs': specs_list, 'factionSplit': faction_split}


def build_class_data(blob: dict, class_name: str, last_updated: str) -> dict:
    result: dict = {
        'slug':        class_slug(class_name),
        'name':        class_name,
        'lastUpdated': last_updated,
    }
    for blob_key, out_key in CONTEXT_KEY_MAP.items():
        ctx = blob.get(blob_key)
        if not ctx:
            result[out_key] = None
            continue
        result[out_key] = _class_context(
            ctx.get('combos', []),
            ctx.get('spec_combos', []),
            class_name,
        )
    return result


# ── Race data ──────────────────────────────────────────────────────────────────

def _race_context(combos: list[dict], race_name: str, faction: str | None) -> dict:
    """Classes list for a race in one context.

    faction=None means aggregate across both faction variants (disambiguation).
    """
    if faction is not None:
        race_combos = [c for c in combos if c['race'] == race_name and c['faction'] == faction]
    else:
        race_combos = [c for c in combos if c['race'] == race_name]

    total = sum(c['count'] for c in race_combos)
    if total == 0:
        return {'classes': []}

    class_counts: dict[str, int] = defaultdict(int)
    for c in race_combos:
        class_counts[c['class']] += c['count']

    classes_list = [
        {
            'slug':       class_slug(cls),
            'name':       cls,
            'percentage': round(cnt * 100.0 / total, 2),
        }
        for cls, cnt in sorted(class_counts.items(), key=lambda x: -x[1])
    ]
    return {'classes': classes_list}


def build_race_data(blob: dict, race_name: str, faction: str, last_updated: str) -> dict:
    """JSON for a single-faction or faction-specific neutral race page."""
    slug       = race_slug(race_name, faction)
    is_neutral = race_name in NEUTRAL_RACE_NAMES

    result: dict = {
        'slug':        slug,
        'name':        race_display_name(race_name, faction) if is_neutral else race_name,
        'faction':     faction,
        'lastUpdated': last_updated,
    }
    if is_neutral:
        result['baseRace']               = slugify(race_name)
        result['isNeutralFactionVariant'] = True

    for blob_key, out_key in CONTEXT_KEY_MAP.items():
        ctx = blob.get(blob_key)
        if not ctx:
            result[out_key] = None
            continue
        result[out_key] = _race_context(ctx.get('combos', []), race_name, faction)

    return result


def build_disambiguation(blob: dict, race_name: str, last_updated: str) -> dict:
    """Disambiguation JSON for a neutral race (aggregates both factions)."""
    base_slug = slugify(race_name)
    variants  = [f'{base_slug}-horde', f'{base_slug}-alliance']

    # Faction choice — use the first context that has data (general → pvp → pve)
    faction_choice = None
    for ctx_key in ('general', 'pvp', 'pve'):
        ctx = blob.get(ctx_key)
        if not ctx:
            continue
        combos = ctx.get('combos', [])
        race_rows = [c for c in combos if c['race'] == race_name]
        horde_n    = sum(c['count'] for c in race_rows if c['faction'] == 'horde')
        alliance_n = sum(c['count'] for c in race_rows if c['faction'] == 'alliance')
        fc_total   = horde_n + alliance_n
        if fc_total > 0:
            faction_choice = {
                'horde':    round(horde_n    / fc_total, 4),
                'alliance': round(alliance_n / fc_total, 4),
            }
            break

    result: dict = {
        'slug':             base_slug,
        'name':             race_name,
        'isDisambiguation': True,
        'variants':         variants,
        'lastUpdated':      last_updated,
        'factionChoice':    faction_choice,
        'aggregate':        {},
    }
    for blob_key, out_key in CONTEXT_KEY_MAP.items():
        ctx = blob.get(blob_key)
        if not ctx:
            result['aggregate'][out_key] = None
            continue
        result['aggregate'][out_key] = _race_context(ctx.get('combos', []), race_name, faction=None)

    return result


# ── Discovery ──────────────────────────────────────────────────────────────────

def discover_classes(blob: dict) -> list[str]:
    """Unique class names found across all contexts."""
    names: set[str] = set()
    for val in blob.values():
        if not isinstance(val, dict):
            continue
        for c in val.get('combos', []):
            names.add(c['class'])
    return sorted(names)


def discover_race_pairs(blob: dict) -> list[tuple[str, str]]:
    """Unique (race_name, faction) pairs found across all contexts."""
    pairs: set[tuple[str, str]] = set()
    for val in blob.values():
        if not isinstance(val, dict):
            continue
        for c in val.get('combos', []):
            pairs.add((c['race'], c['faction']))
    return sorted(pairs)


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description='Generate SEO JSON data files')
    parser.add_argument('--blob-url', help='Override demographics blob URL')
    args = parser.parse_args()

    blob_url = (
        args.blob_url
        or os.environ.get('NEXT_PUBLIC_DEMOGRAPHICS_URL')
        or os.environ.get('DEMOGRAPHICS_URL')
    )
    if not blob_url:
        sys.exit(
            'ERROR: No blob URL found.\n'
            '  Set NEXT_PUBLIC_DEMOGRAPHICS_URL in frontend/.env.local, or\n'
            '  pass --blob-url <url>'
        )

    blob = fetch_blob(blob_url)

    last_updated = blob.get('updated', '')
    if last_updated and 'T' not in last_updated:
        last_updated = f'{last_updated}T00:00:00Z'

    CLASSES_DIR.mkdir(parents=True, exist_ok=True)
    RACES_DIR.mkdir(parents=True, exist_ok=True)

    # ── Class files ───────────────────────────────────────────────────────────
    class_names = discover_classes(blob)
    logger.info(f'Writing {len(class_names)} class files...')
    for class_name in class_names:
        data = build_class_data(blob, class_name, last_updated)
        path = CLASSES_DIR / f'{data["slug"]}.json'
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        logger.info(f'  {path.name}')

    # ── Race files ────────────────────────────────────────────────────────────
    race_pairs = discover_race_pairs(blob)
    logger.info(f'Writing race files for {len(race_pairs)} race+faction combos...')

    seen_neutral: set[str] = set()
    for race_name, faction in race_pairs:
        # Faction-specific page
        data = build_race_data(blob, race_name, faction, last_updated)
        path = RACES_DIR / f'{data["slug"]}.json'
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        logger.info(f'  {path.name}')

        # Disambiguation page (once per neutral race)
        if race_name in NEUTRAL_RACE_NAMES:
            base = slugify(race_name)
            if base not in seen_neutral:
                seen_neutral.add(base)
                dis  = build_disambiguation(blob, race_name, last_updated)
                dpath = RACES_DIR / f'{base}.json'
                dpath.write_text(json.dumps(dis, indent=2, ensure_ascii=False))
                logger.info(f'  {dpath.name}  (disambiguation)')

    # ── Summary ───────────────────────────────────────────────────────────────
    n_cls   = len(list(CLASSES_DIR.glob('*.json')))
    n_race  = len(list(RACES_DIR.glob('*.json')))
    print()
    print('=== SEO data summary ===')
    print(f'  classes/  {n_cls} files')
    print(f'  races/    {n_race} files')
    print(f'  total     {n_cls + n_race} files')
    print()


if __name__ == '__main__':
    main()
