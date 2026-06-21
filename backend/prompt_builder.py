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


def _media_type(frame: bytes) -> str:
    if frame[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    return "image/jpeg"


def build(personality: dict, frame, speech: str = "", history=None,
          decide: bool = False) -> dict:
    history = history or []

    has_frame = bool(frame)
    has_speech = bool(speech)

    content = []
    if has_frame:  # vision: include the camera frame as an image block
        b64 = base64.standard_b64encode(frame).decode("ascii")
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": _media_type(frame), "data": b64},
        })

    # Bodycam model: the image is the wearer's first-person view; the speech is
    # AMBIENT audio overheard in the scene. NARRATE the moment as an outside
    # observer (third person) — never address the wearer or anyone in frame.
    if has_frame and has_speech:
        instr = ("This is your bodycam view, and this is what can be heard right now. "
                 "Narrate this moment — what's happening in front of you and what's being "
                 "said — in character, as an outside observer. ONE short sentence. "
                 "No preamble; do NOT address anyone or say 'you'.")
    elif has_frame:
        instr = ("This is your bodycam view. Narrate what's happening in front of you, in "
                 "character, as an outside observer. ONE short sentence. "
                 "No preamble; do NOT address anyone or say 'you'.")
    else:
        instr = ("Narrate this moment from what can be heard, in character, as an outside "
                 "observer. ONE short sentence. No preamble; do NOT address anyone.")

    lines = [instr]
    if has_speech:
        lines.append(f'Overheard in the scene: "{speech}"')
    if history:
        lines.append(
            "Your memory — recent lines you've narrated this session (never repeat or "
            "lightly reword them, but you MAY call back to them or build a running "
            "gag for continuity): " + " | ".join(history[-8:]))
    if decide:
        # Comedic timing: the funniest narrator waits for the moment, then lands it.
        lines.append(
            "You are a COMEDIC narrator on a live feed, and great comedy is about "
            "TIMING, not constant talking. Stay quiet through dull or unchanged "
            "moments and wait for an opportune beat: someone enters, reacts, makes a "
            "face, does something awkward or unexpected, a funny juxtaposition, or a "
            "clear change. When a moment like that lands, deliver ONE genuinely funny, "
            "sharp in-character line — a real punchline, not a safe generic observation. "
            "Otherwise reply with exactly SKIP (one word, nothing else) — also SKIP if "
            "the scene is basically the same as your recent lines."
        )

    content.append({"type": "text", "text": "\n".join(lines)})

    return {
        "system": personality.get("claude_system_prompt", ""),
        "messages": [{"role": "user", "content": content}],
        "personality_name": personality.get("name", "Narrator"),
        "personality_slug": personality.get("slug", ""),
        "mock_hint": speech or None,
    }
