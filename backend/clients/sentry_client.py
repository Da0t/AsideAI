"""Sentry client — RELIABILITY (monitors this laptop orchestrator).

Init Sentry if SENTRY_DSN is set and sentry_sdk is installed; otherwise a no-op,
so the backend runs with no install. It must never slow or block the live loop.
"""

import logging

from ..config import config

log = logging.getLogger("sentry")


def init() -> bool:
    """Initialize Sentry; return True if active, False if disabled/unavailable."""
    if not config.sentry_dsn:
        return False
    try:
        import sentry_sdk  # optional dependency
    except ImportError:
        log.info("sentry_sdk not installed — monitoring disabled")
        return False
    sentry_sdk.init(dsn=config.sentry_dsn, traces_sample_rate=0.1)
    log.info("Sentry initialized")
    return True
