"""Deepgram TTS client — VOICE.

Turns Claude's short line into voice audio, using the active personality's
Deepgram voice id. Different personality -> different voice.

TODO: implement. This is a scaffold stub.
"""


def speak(line: str, voice: str) -> bytes:
    """Synthesize `line` into voice audio in the given Deepgram `voice`.

    Args:
        line: the short in-character narration from Claude.
        voice: the active personality's deepgram_voice id.

    Returns:
        Audio bytes to push to the frontend (which plays it, ducking music).

    TODO:
      - Deepgram TTS with DEEPGRAM_API_KEY and the given voice
      - return audio bytes/stream; keep latency low (hot path)
    """
    raise NotImplementedError("TODO: Deepgram TTS")
