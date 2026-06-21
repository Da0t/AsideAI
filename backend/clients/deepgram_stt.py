"""Deepgram STT client — EARS.

Transcribes mic audio coming from the Pi so narration can react to what people say.

The live product wants *streaming* STT (Deepgram WebSocket) — that's a build-time
task. For now this offers:
  - latest_transcript(): returns the most recent transcript the loop has (mock: "")
  - transcribe(pcm): a prerecorded REST call (stdlib urllib) for buffered audio,
    real when a key is present, "" otherwise.
"""

import logging

from ..config import config
from .. import _http

log = logging.getLogger("stt")

_API_URL = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"

# Most-recent transcript, updated by transcribe() / streaming during the loop.
_latest = ""


def latest_transcript() -> str:
    """Return the most recent speech transcript (may be empty)."""
    return _latest


def _pcm_to_wav(pcm: bytes, rate: int) -> bytes:
    import io
    import wave

    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)
    return buf.getvalue()


def transcribe(pcm: bytes, sample_rate: int = 16000) -> str:
    """Prerecorded STT over REST. Real with a key; "" in mock mode or on error.

    Wraps the raw PCM in a WAV container so Deepgram auto-detects the format.
    """
    global _latest
    if not config.has_deepgram or not pcm:
        return _latest
    status, body = _http.post(
        _API_URL,
        headers={
            "authorization": f"Token {config.deepgram_api_key}",
            "content-type": "audio/wav",
        },
        data=_pcm_to_wav(pcm, sample_rate),
    )
    if status != 200:
        log.warning("Deepgram STT HTTP %s: %s", status, body[:200])
        return _latest

    import json

    data = json.loads(body)
    try:
        _latest = data["results"]["channels"][0]["alternatives"][0]["transcript"]
    except (KeyError, IndexError):
        pass
    return _latest
