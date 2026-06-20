"""Deepgram TTS client — VOICE.

Turns Claude's short line into voice audio in the active personality's Deepgram
voice. Real call uses the Deepgram Speak REST API over stdlib urllib. With no key,
returns a short silent WAV (stdlib) so the loop runs and there's an artifact to
hand the frontend.
"""

import io
import logging
import wave

from ..config import config
from .. import _http

log = logging.getLogger("tts")

_API_URL = "https://api.deepgram.com/v1/speak"


def _silent_wav(ms: int = 250, rate: int = 16000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b"\x00\x00" * int(rate * ms / 1000))
    return buf.getvalue()


def speak(line: str, voice: str) -> bytes:
    """Synthesize `line` into audio bytes in the given Deepgram `voice`."""
    if not config.has_deepgram:
        log.info("[mock TTS · %s] %s", voice or "default", line)
        return _silent_wav()

    model = voice or "aura-asteria-en"
    status, body = _http.post_json(
        f"{_API_URL}?model={model}",
        headers={"authorization": f"Token {config.deepgram_api_key}"},
        obj={"text": line},
    )
    if status != 200:
        log.warning("Deepgram TTS HTTP %s: %s", status, body[:200])
        return _silent_wav()
    return body  # audio bytes (mp3 by default) for the phone to play
