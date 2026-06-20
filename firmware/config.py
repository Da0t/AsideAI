"""Firmware configuration — reads env, holds device settings.

TODO: load and validate. Nothing here should be interpretation logic; this is
just where the firmware learns the keys and endpoints it needs.
"""

# TODO: load .env (python-dotenv)
# TODO: OVERSHOOT_API_KEY        — create/keep the Overshoot stream
# TODO: BACKEND_AUDIO_URL        — where to send mic audio (WS/HTTP)
# TODO: CAMERA_* / MIC_*         — device indices, resolution, frame rate
# TODO: KEEPALIVE_INTERVAL_SEC   — must be < ~5 min (stream TTL)

raise NotImplementedError("TODO: firmware config")
