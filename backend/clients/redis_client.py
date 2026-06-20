"""Redis client — MEMORY + STATE.

Two jobs:
  1. STATE: the active personality + mode, shared between backend and frontend.
     The frontend writes switches here; the live loop reads them.
  2. MEMORY: narration history, so Claude can make callbacks to earlier lines.

TODO: implement. This is a scaffold stub.
"""


# --- State (active personality / mode) ---------------------------------------

def get_active_personality():
    """Return the currently active personality bundle (or its slug/ref).

    TODO: read active personality from Redis (set by the frontend switcher).
    """
    raise NotImplementedError("TODO: Redis get active personality")


def set_active_personality(slug: str) -> None:
    """Set the active personality. TODO: write to Redis (called via frontend)."""
    raise NotImplementedError("TODO: Redis set active personality")


def get_mode():
    """Return the active mode. TODO: read from Redis."""
    raise NotImplementedError("TODO: Redis get mode")


def set_mode(mode: str) -> None:
    """Set the active mode. TODO: write to Redis."""
    raise NotImplementedError("TODO: Redis set mode")


# --- Memory (narration history for callbacks) --------------------------------

def append_line(line: str) -> None:
    """Append a narration line to history (capped to HISTORY_LEN).

    TODO: push to a Redis list; trim to config.HISTORY_LEN.
    """
    raise NotImplementedError("TODO: Redis append narration line")


def recent_lines():
    """Return recent narration lines for callbacks.

    TODO: read the last N lines from Redis.
    """
    raise NotImplementedError("TODO: Redis recent lines")
