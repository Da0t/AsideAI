"""Backend configuration — env + tunables.

TODO: load and validate. Keep the live-loop tunables here so latency is easy to
tighten in one place.
"""

# TODO: load .env (python-dotenv)
#
# Service keys:
#   OVERSHOOT_API_KEY, DEEPGRAM_API_KEY, ANTHROPIC_API_KEY
#   REDIS_URL, SENTRY_DSN
#
# Live-loop tunables (design rule: stay ~1-2s, narration SHORT):
#   CLAUDE_MODEL          = "claude-haiku-..."   # short, fast
#   CLAUDE_MAX_TOKENS     = small                # one or two punchy sentences
#   LOOP_INTERVAL_SEC     = how often to narrate
#   HISTORY_LEN           = how many past lines to keep for callbacks
#
# Overshoot video refs:
#   ovs://streams/{stream_id}?frame_index=-1
#   ovs://streams/{stream_id}?start_offset_ms=-5000

raise NotImplementedError("TODO: backend config")
