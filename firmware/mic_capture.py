"""Mic capture — grab audio chunks and stream them to the backend.

The backend feeds this audio to Deepgram STT. Firmware does NOT transcribe.

TODO: implement. This is a scaffold stub.
"""


def start_streaming(to: str) -> None:
    """Capture mic audio and send chunks to the backend.

    Args:
        to: backend audio endpoint (WebSocket/HTTP) from config.

    TODO:
      - open the mic (sounddevice)
      - read audio chunks at a suitable rate/format for Deepgram STT
      - stream chunks to `to` (websockets); reconnect on drop
    """
    raise NotImplementedError("TODO: mic capture + stream to backend")
