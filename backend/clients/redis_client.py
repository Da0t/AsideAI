"""Redis client — MEMORY + STATE.

Two jobs:
  1. STATE: active personality + mode, shared between backend and frontend.
  2. MEMORY: narration history, so Claude can call back to earlier lines.

Uses a real Redis when `redis` is installed and `REDIS_URL` is set; otherwise an
in-memory fallback with the same interface, so the loop runs with no install.
"""

import logging

from ..config import config

log = logging.getLogger("redis")

_KEY_PERSONALITY = "narrator:personality"
_KEY_MODE = "narrator:mode"
_KEY_HISTORY = "narrator:history"


class _MemoryStore:
    """In-memory stand-in for Redis (single-process dev/mock)."""

    def __init__(self) -> None:
        self._kv = {}
        self._list = []

    def get(self, key):
        return self._kv.get(key)

    def set(self, key, val):
        self._kv[key] = val

    def push(self, val, cap):
        self._list.append(val)
        del self._list[: max(0, len(self._list) - cap)]

    def recent(self, n):
        return list(self._list[-n:])


def _connect():
    if not config.redis_url:
        return None
    try:
        import redis  # optional dependency
    except ImportError:
        log.info("redis package not installed — using in-memory store")
        return None
    try:
        client = redis.Redis.from_url(config.redis_url, decode_responses=True)
        client.ping()
        return client
    except Exception as e:  # noqa: BLE001 — degrade gracefully to in-memory
        log.warning("Redis unreachable (%s) — using in-memory store", e)
        return None


_redis = _connect()
_mem = _MemoryStore()
LIVE = _redis is not None


# --- State -------------------------------------------------------------------

def set_active_personality(slug: str) -> None:
    if _redis:
        _redis.set(_KEY_PERSONALITY, slug)
    else:
        _mem.set(_KEY_PERSONALITY, slug)


def get_active_personality():
    return _redis.get(_KEY_PERSONALITY) if _redis else _mem.get(_KEY_PERSONALITY)


def set_mode(mode: str) -> None:
    if _redis:
        _redis.set(_KEY_MODE, mode)
    else:
        _mem.set(_KEY_MODE, mode)


def get_mode():
    return _redis.get(_KEY_MODE) if _redis else _mem.get(_KEY_MODE)


# --- Memory (narration history for callbacks) --------------------------------

def append_line(line: str) -> None:
    if _redis:
        _redis.rpush(_KEY_HISTORY, line)
        _redis.ltrim(_KEY_HISTORY, -config.history_len, -1)
    else:
        _mem.push(line, config.history_len)


def recent_lines():
    if _redis:
        return _redis.lrange(_KEY_HISTORY, -config.history_len, -1)
    return _mem.recent(config.history_len)
