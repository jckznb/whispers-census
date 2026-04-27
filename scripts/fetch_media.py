"""
Fetch official Blizzard media asset URLs for all playable classes, races, and specs.

Outputs three JSON manifests to frontend/data/media/:
  classes.json  — { slug: { id, name, icon } }
  races.json    — { slug: { id, name, faction, icon, ... } }  (neutral races duplicated)
  specs.json    — { slug: { id, name, class_slug, icon } }

Run once to bootstrap, re-run when a new expansion adds classes/races/specs.

Usage:
  python -m scripts.fetch_media
  python -m scripts.fetch_media --region eu  (future)
"""
import json
import logging
import re
import sys
from pathlib import Path

from crawler.client import get as api_get

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

REGION = 'us'
NAMESPACE = f'static-{REGION}'

# Blizzard class ID → URL slug (matches SEO page routes)
CLASS_SLUG_MAP: dict[int, str] = {
    1:  'warrior',
    2:  'paladin',
    3:  'hunter',
    4:  'rogue',
    5:  'priest',
    6:  'death-knight',
    7:  'shaman',
    8:  'mage',
    9:  'warlock',
    10: 'monk',
    11: 'druid',
    12: 'demon-hunter',
    13: 'evoker',
}

# Neutral races that exist in both factions — duplicated in the race manifest
# under base slug + both faction-suffixed slugs.
NEUTRAL_RACE_NAMES = {'Pandaren', 'Dracthyr', 'Earthen', 'Haranir'}

# Output directory (relative to repo root)
OUTPUT_DIR = Path(__file__).parent.parent / 'frontend' / 'data' / 'media'


# ── Helpers ───────────────────────────────────────────────────────────────────

def slugify(name: str) -> str:
    """Convert a display name to a URL-safe slug.

    "Mag'har Orc" → 'mag-har-orc'  (apostrophe becomes word boundary → hyphen)
    'Night Elf'   → 'night-elf'
    'Death Knight'→ 'death-knight'
    """
    s = name.lower()
    s = re.sub(r"['\u2019]", '-', s)   # apostrophe → hyphen (word boundary)
    s = re.sub(r'[^a-z0-9]+', '-', s)  # remaining non-alnum → hyphen
    return s.strip('-')


def extract_icon(assets: list[dict]) -> str | None:
    """Return the value of the first 'icon' asset entry, or None."""
    for asset in assets or []:
        if asset.get('key') == 'icon':
            return asset.get('value')
    return None


def fetch_media(category: str, item_id: int) -> list[dict]:
    """Fetch the assets list from a media endpoint, returning [] on miss."""
    resp = api_get(
        f'/data/wow/media/{category}/{item_id}',
        region=REGION,
        namespace=NAMESPACE,
    )
    if resp is None:
        logger.warning(f'No media for {category}/{item_id}')
        return []
    return resp.get('assets', [])


# ── Class manifest ─────────────────────────────────────────────────────────────

def build_classes_manifest() -> dict:
    logger.info('Fetching playable class index…')
    index = api_get('/data/wow/playable-class/index', region=REGION, namespace=NAMESPACE)
    classes_raw = index.get('classes', [])
    logger.info(f'  {len(classes_raw)} classes found')

    manifest = {}
    for cls in classes_raw:
        cls_id   = cls['id']
        cls_name = cls['name']
        slug     = CLASS_SLUG_MAP.get(cls_id)

        if slug is None:
            # New class added — derive slug from name and warn so we can add it
            slug = slugify(cls_name)
            logger.warning(f'Unknown class id={cls_id} name={cls_name!r} — using slug {slug!r}; add to CLASS_SLUG_MAP')

        logger.info(f'  class {cls_id}: {cls_name!r} → {slug}')
        assets = fetch_media('playable-class', cls_id)
        icon   = extract_icon(assets)

        if not icon:
            logger.warning(f'  No icon asset for class {cls_name!r}')

        entry = {'id': cls_id, 'name': cls_name, 'icon': icon}
        # Include any additional asset keys beyond 'icon'
        for asset in assets:
            key = asset.get('key')
            if key and key != 'icon':
                entry[key] = asset.get('value')

        manifest[slug] = entry

    return manifest


# ── Race manifest ──────────────────────────────────────────────────────────────

def build_races_manifest() -> dict:
    logger.info('Fetching playable race index…')
    index = api_get('/data/wow/playable-race/index', region=REGION, namespace=NAMESPACE)
    races_raw = index.get('races', [])
    logger.info(f'  {len(races_raw)} races found')

    manifest = {}

    for race in races_raw:
        race_id   = race['id']
        race_name = race['name']
        # faction comes from the index entry: {'type': 'ALLIANCE'/'HORDE'/'NEUTRAL', 'name': ...}
        faction_data = race.get('faction', {})
        faction_type = faction_data.get('type', '').lower()  # 'alliance', 'horde', or 'neutral'

        base_slug = slugify(race_name)
        logger.info(f'  race {race_id}: {race_name!r} ({faction_type}) → {base_slug}')

        assets = fetch_media('playable-race', race_id)
        icon   = extract_icon(assets)

        if not icon:
            logger.warning(f'  No icon asset for race {race_name!r}')

        entry = {'id': race_id, 'name': race_name, 'faction': faction_type, 'icon': icon}
        for asset in assets:
            key = asset.get('key')
            if key and key != 'icon':
                entry[key] = asset.get('value')

        is_neutral = race_name in NEUTRAL_RACE_NAMES or faction_type == 'neutral'

        if is_neutral:
            # Neutral race — store under base slug plus both faction suffixes
            manifest[base_slug]              = {**entry, 'faction': 'neutral'}
            manifest[f'{base_slug}-alliance'] = {**entry, 'faction': 'alliance'}
            manifest[f'{base_slug}-horde']    = {**entry, 'faction': 'horde'}
            logger.info(f'    → {base_slug}, {base_slug}-alliance, {base_slug}-horde')
        else:
            manifest[base_slug] = entry

    return manifest


# ── Spec manifest ──────────────────────────────────────────────────────────────

def build_specs_manifest() -> dict:
    """
    Build the spec manifest by iterating each class's detail page, which lists
    its specializations (with correct class association).  This is more reliable
    than the spec index, which does not include the parent class in its entries.

    Fetches: 13 class detail calls + 1 media call per spec (~40).
    """
    logger.info('Fetching specs via class detail pages…')
    manifest = {}

    for cls_id, class_slug in CLASS_SLUG_MAP.items():
        cls_detail = api_get(
            f'/data/wow/playable-class/{cls_id}',
            region=REGION,
            namespace=NAMESPACE,
        )
        if not cls_detail:
            logger.warning(f'No detail for class id={cls_id} ({class_slug})')
            continue

        cls_name = cls_detail.get('name', class_slug)
        specs_list = cls_detail.get('specializations', [])
        logger.info(f'  {cls_name}: {len(specs_list)} specs')

        for spec_ref in specs_list:
            spec_id   = spec_ref['id']
            spec_name = spec_ref['name']
            spec_slug = f'{class_slug}-{slugify(spec_name)}'

            logger.info(f'    spec {spec_id}: {spec_name!r} → {spec_slug}')

            assets = fetch_media('playable-specialization', spec_id)
            icon   = extract_icon(assets)

            if not icon:
                logger.warning(f'    No icon asset for spec {spec_name!r}')

            entry = {
                'id':         spec_id,
                'name':       spec_name,
                'class_slug': class_slug,
                'class_name': cls_name,
                'icon':       icon,
            }
            for asset in assets:
                key = asset.get('key')
                if key and key != 'icon':
                    entry[key] = asset.get('value')

            manifest[spec_slug] = entry

    return manifest


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    manifests = {
        'classes': build_classes_manifest(),
        'races':   build_races_manifest(),
        'specs':   build_specs_manifest(),
    }

    for name, data in manifests.items():
        path = OUTPUT_DIR / f'{name}.json'
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        logger.info(f'Wrote {len(data)} entries → {path}')

    # Quick verification summary
    print('\n=== Manifest summary ===')
    for name, data in manifests.items():
        missing_icons = [k for k, v in data.items() if not v.get('icon')]
        status = 'OK' if not missing_icons else f'{len(missing_icons)} missing icons'
        print(f'  {name}.json: {len(data)} entries  [{status}]')
        if missing_icons:
            for slug in missing_icons:
                print(f'    - {slug}')
    print()


if __name__ == '__main__':
    main()
