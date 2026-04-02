"""Phase 2: Mythic+ leaderboard crawler (stub — implemented in Sprint 3)."""
import logging

logger = logging.getLogger(__name__)


def crawl_mythic_plus(region: str = 'us') -> None:
    # TODO Phase 2
    # 1. For each connected realm: GET /data/wow/connected-realm/{id}/mythic-leaderboard/index
    # 2. For each dungeon: GET /data/wow/connected-realm/{id}/mythic-leaderboard/{dungeonId}/period/{period}
    # 3. Each run has up to 5 members — resolve character profiles (heavy dedup helps)
    # 4. Store runs in mythic_plus_runs and members in mythic_plus_members
    logger.info('M+ crawler not yet implemented (Phase 2)')
