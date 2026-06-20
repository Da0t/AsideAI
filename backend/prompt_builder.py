"""Prompt builder — assemble the Claude Haiku (vision) request.

Combines the active personality's system prompt with the live context: the camera
FRAME (as a base64 image block), recent speech, and a little narration history for
callbacks. Claude sees the frame and writes the line in one call.

Returns a dict main.py hands to claude.narrate():
    {
      "system":   personality system prompt (str),
      "messages": [{"role":"user","content":[<image>, <text>]}],
      "personality_name": str,   # for logging / mock output
      "personality_slug": str,
      "mock_hint": str | None,   # speech, used to flavor the offline mock line
    }
"""

import base64


def build(personality: dict, frame: bytes, speech: str = "", history=None) -> dict:
    history = history or []

    b64 = base64.standard_b64encode(frame or b"").decode("ascii")

    lines = ["Narrate this exact moment, in character. ONE short sentence. No preamble."]
    if speech:
        lines.append(f'Someone in the room just said: "{speech}"')
    if history:
        lines.append("Earlier lines you may call back to: " + " | ".join(history[-3:]))

    content = [
        {
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": b64},
        },
        {"type": "text", "text": "\n".join(lines)},
    ]

    return {
        "system": personality.get("claude_system_prompt", ""),
        "messages": [{"role": "user", "content": content}],
        "personality_name": personality.get("name", "Narrator"),
        "personality_slug": personality.get("slug", ""),
        "mock_hint": speech or None,
    }
