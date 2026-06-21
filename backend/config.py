"""Backend configuration — env + live-loop tunables.

Stdlib-only loader (uses python-dotenv if installed, else a tiny built-in parser),
so the backend runs with no extra installs. The backend runs on a LAPTOP on the
same LAN as the QNX Pi.
"""

import os

_ENV_PATH = os.path.join(os.path.dirname(__file__), os.pardir, ".env")


def _load_dotenv(path: str) -> None:
    """Populate os.environ from a .env file (does not overwrite existing vars)."""
    try:
        from dotenv import load_dotenv  # optional dependency
        load_dotenv(path)
        return
    except ImportError:
        pass
    try:
        with open(path, "r", encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip())
    except FileNotFoundError:
        pass


class Config:
    def __init__(self) -> None:
        _load_dotenv(_ENV_PATH)

        # Service credentials (empty => that client runs in offline/mock mode)
        self.anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
        self.deepgram_api_key = os.environ.get("DEEPGRAM_API_KEY", "").strip()
        self.redis_url = os.environ.get("REDIS_URL", "").strip()
        self.sentry_dsn = os.environ.get("SENTRY_DSN", "").strip()

        # Firmware ingest (the Pi connects here over the LAN)
        host, _, port = os.environ.get("FIRMWARE_LISTEN", "0.0.0.0:8765").partition(":")
        self.firmware_host = host or "0.0.0.0"
        self.firmware_port = int(port or "8765")

        # Phone WebSocket (served to the frontend over the LAN)
        self.phone_ws_port = int(os.environ.get("PHONE_WS_PORT", "8780"))

        # Live-loop tunables (design rule: stay ~1-2s, narration SHORT)
        self.claude_model = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5")
        self.claude_max_tokens = int(os.environ.get("CLAUDE_MAX_TOKENS", "80"))
        self.frame_max_dim = int(os.environ.get("FRAME_MAX_DIM", "768"))
        self.loop_interval_sec = float(os.environ.get("LOOP_INTERVAL_SEC", "2.0"))
        self.history_len = int(os.environ.get("HISTORY_LEN", "12"))  # agent memory window

        # Change-gated perception (two-tier loop): a cheap local watcher samples at
        # watch_fps and only wakes the Claude vision call when the view moves by
        # change_threshold (0..1 mean pixel delta); quiet scenes still get a look
        # every quiet_checkin_sec so audio-only / slow moments aren't missed.
        self.watch_fps = float(os.environ.get("WATCH_FPS", "5"))
        # 0.03 sits just above a measured webcam noise floor (~0.019 peak) so it still
        # ignores sensor noise/auto-exposure, but reacts to smaller movements (a hand,
        # a lean, a shift) — not just someone walking fully into frame.
        self.change_threshold = float(os.environ.get("CHANGE_THRESHOLD", "0.03"))
        # How often a quiet, unchanged scene still gets a look (lower = chattier).
        self.quiet_checkin_sec = float(os.environ.get("QUIET_CHECKIN_SEC", "8"))

    @property
    def has_anthropic(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def has_deepgram(self) -> bool:
        return bool(self.deepgram_api_key)

    def summary(self) -> str:
        def mark(ok: bool) -> str:
            return "live" if ok else "MOCK"
        from .clients import redis_client  # lazy: reflects the real connection state
        return (
            f"claude={mark(self.has_anthropic)} "
            f"deepgram={mark(self.has_deepgram)} "
            f"redis={'live' if redis_client.LIVE else 'in-memory'} "
            f"sentry={'on' if self.sentry_dsn else 'off'} "
            f"firmware_listen={self.firmware_host}:{self.firmware_port}"
        )


config = Config()
