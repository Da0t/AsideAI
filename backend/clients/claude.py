"""Claude client — EYES + BRAIN (vision + narration in one call).

Claude Haiku 4.5 takes the camera frame (image input) + the personality prompt and
returns ONE short in-character line. This replaced Overshoot — there is no separate
scene-description step.

Real call uses the Anthropic Messages REST API over stdlib urllib (no SDK install
needed). With no key, runs in offline mock mode so the loop is testable today.
"""

import logging

from ..config import config
from .. import _http

log = logging.getLogger("claude")

_API_URL = "https://api.anthropic.com/v1/messages"

# Offline demo lines so `--mock` visibly shows three different characters without
# a key. The real path replaces these with Claude's output.
_MOCK_LINES = {
    "hype-man": "AYO they're BACK and the energy is UNREAL, let's GOOO!",
    "goth-mommy": "There you are, my little raven — you're doing so beautifully today.",
    "epic-quest-narrator": "Lo! The hero returns to the chamber, and the saga continues.",
}


def _mock(prompt: dict) -> str:
    slug = prompt.get("personality_slug", "")
    line = _MOCK_LINES.get(slug, f"[{prompt.get('personality_name', 'Narrator')}] a moment unfolds.")
    hint = prompt.get("mock_hint")
    return f'{line} (heard: "{hint}")' if hint else line


def narrate(prompt: dict) -> str:
    """Generate one short in-character line from a frame + personality prompt."""
    if not config.has_anthropic:
        return _mock(prompt)  # offline mock — no network call

    status, body = _http.post_json(
        _API_URL,
        headers={
            "x-api-key": config.anthropic_api_key,
            "anthropic-version": "2023-06-01",
        },
        obj={
            "model": config.claude_model,
            "max_tokens": config.claude_max_tokens,
            "system": prompt["system"],
            "messages": prompt["messages"],
        },
    )
    if status != 200:
        log.warning("Claude HTTP %s: %s", status, body[:200])
        return _mock(prompt)

    import json

    data = json.loads(body)
    parts = [b.get("text", "") for b in data.get("content", []) if b.get("type") == "text"]
    return "".join(parts).strip() or _mock(prompt)
