"""Capture mic audio on the laptop (sounddevice). Dev/demo input for `--talk`.

Returns raw PCM (s16le, mono) bytes — the shape deepgram_stt.transcribe() wraps
into a WAV. On the real wearable, mic audio arrives from the Pi over the LAN
instead; this is the laptop stand-in so you can talk to it without hardware.

macOS will ask for microphone permission the first time — grant it to your
terminal/IDE, or recordings come back silent.
"""

import logging

log = logging.getLogger("mic")

SAMPLE_RATE = 16000


def available() -> bool:
    try:
        import sounddevice  # noqa: F401
        return True
    except Exception:  # noqa: BLE001
        return False


def pick_input_device():
    """Prefer a Blue Yeti / Snowball if plugged in; else None (system default)."""
    try:
        import sounddevice as sd
        for i, d in enumerate(sd.query_devices()):
            if d["max_input_channels"] > 0 and any(
                k in d["name"].lower() for k in ("snowball", "yeti", "blue")
            ):
                return i
    except Exception:  # noqa: BLE001
        pass
    return None


def device_name() -> str:
    try:
        import sounddevice as sd
        idx = pick_input_device()
        info = sd.query_devices(idx) if idx is not None else sd.query_devices(kind="input")
        return info["name"]
    except Exception:  # noqa: BLE001
        return "unknown"


def record(seconds: float = 5.0, rate: int = SAMPLE_RATE) -> bytes:
    """Block for `seconds`, capturing mono s16le PCM (Snowball if present)."""
    import sounddevice as sd  # imported lazily so --mock never needs it

    frames = sd.rec(
        int(seconds * rate),
        samplerate=rate,
        channels=1,
        dtype="int16",
        device=pick_input_device(),
    )
    sd.wait()
    return frames.tobytes()
