"""
Build and upload the demographics JSON blob to Vercel Blob storage.

The blob is a single small file (~5-10KB) served by Vercel's CDN.
The frontend fetches it once per page load — no Supabase connections needed.

JSON shape:
{
  "updated": "2026-03-31",
  "pvp":     { "total": 45230, "combos": [{"race":..., "faction":..., "class":..., "count":..., "pct":...}, ...] },
  "pve":     null,   # null until Phase 2
  "general": null    # null until Phase 3
}
"""
import json
import logging
from datetime import date
import httpx
from . import db
from .config import BLOB_READ_WRITE_TOKEN

logger = logging.getLogger(__name__)

BLOB_PATHNAME = 'demographics.json'
BLOB_UPLOAD_URL = f'https://blob.vercel-storage.com/{BLOB_PATHNAME}'

# Maps blob key → demographics_snapshot context value
CONTEXT_MAP = {
    'pvp':     'pvp_all',
    'pve':     'mplus_all',
    'general': 'general',
}


def _load_lookups() -> tuple[dict, dict]:
    """Fetch races and classes from Supabase, return id→data dicts."""
    races = {r['id']: r for r in db.select('races', columns='id,name,faction')}
    classes = {c['id']: c for c in db.select('classes', columns='id,name')}
    return races, classes


def _build_context(db_context: str, races: dict, classes: dict) -> dict | None:
    """
    Query demographics_snapshot for db_context, collapse to race+class,
    return {"total": N, "combos": [...]} or None if no data.
    """
    rows = db.select('demographics_snapshot', filters={'context': db_context})
    if not rows:
        return None

    # Find the latest snapshot date
    latest = max(r['snapshot_date'] for r in rows)
    rows = [r for r in rows if r['snapshot_date'] == latest]

    # Sum counts across specs/genders for each race+class pair
    combo_counts: dict[tuple, int] = {}
    for row in rows:
        key = (row['race_id'], row['class_id'])
        combo_counts[key] = combo_counts.get(key, 0) + row['count']

    total = sum(combo_counts.values())
    if total == 0:
        return None

    combos = []
    for (race_id, class_id), count in sorted(combo_counts.items(), key=lambda x: -x[1]):
        race = races.get(race_id)
        cls = classes.get(class_id)
        if not race or not cls:
            continue
        combos.append({
            'race':    race['name'],
            'faction': race['faction'],
            'class':   cls['name'],
            'count':   count,
            'pct':     round(count * 100.0 / total, 2),
        })

    return {'total': total, 'combos': combos}


def export_demographics(snapshot_date: date = None) -> str | None:
    """
    Build and upload the demographics JSON. Returns the blob URL, or None on failure.
    Logs a warning and skips upload if BLOB_READ_WRITE_TOKEN is not configured.
    """
    if not BLOB_READ_WRITE_TOKEN:
        logger.warning('BLOB_READ_WRITE_TOKEN not set — skipping export')
        return None

    if snapshot_date is None:
        snapshot_date = date.today()

    logger.info('Building demographics export...')
    races, classes = _load_lookups()

    payload = {'updated': snapshot_date.isoformat()}
    for blob_key, db_context in CONTEXT_MAP.items():
        payload[blob_key] = _build_context(db_context, races, classes)
        ctx_data = payload[blob_key]
        status = 'no data' if ctx_data is None else f"{ctx_data['total']:,} total characters"
        logger.info(f'  {blob_key}: {status}')

    json_bytes = json.dumps(payload, separators=(',', ':')).encode()
    logger.info(f'Uploading {len(json_bytes):,} bytes to Vercel Blob...')

    r = httpx.put(
        BLOB_UPLOAD_URL,
        content=json_bytes,
        headers={
            'Authorization': f'Bearer {BLOB_READ_WRITE_TOKEN}',
            'Content-Type': 'application/json',
            'x-add-random-suffix': '0',
        },
        timeout=30,
    )
    r.raise_for_status()

    blob_url = r.json().get('url')
    logger.info(f'Upload complete: {blob_url}')
    return blob_url
