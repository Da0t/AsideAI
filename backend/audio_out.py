"""Play narration audio out loud on the laptop (macOS `afplay`).

Dev/demo convenience so you can hear the voices without the phone. Best-effort and
blocking (plays to completion); logs and returns on any failure.
"""

import logging
import os
import subprocess
import tempfile

log = logging.getLogger("audio_out")


def _suffix(audio: bytes) -> str:
    if audio[:3] == b"ID3" or audio[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"):
        return ".mp3"
    if audio[:4] == b"RIFF":
        return ".wav"
    return ".mp3"  # Deepgram TTS default container


def play(audio: bytes) -> None:
    """Write `audio` to a temp file and play it with afplay (blocking)."""
    if not audio:
        return
    path = None
    try:
        fd, path = tempfile.mkstemp(suffix=_suffix(audio))
        with os.fdopen(fd, "wb") as f:
            f.write(audio)
        subprocess.run(["afplay", path], check=False)
    except FileNotFoundError:
        log.warning("afplay not found — out-loud playback is macOS-only")
    except Exception as e:  # noqa: BLE001
        log.warning("playback failed: %s", e)
    finally:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass
