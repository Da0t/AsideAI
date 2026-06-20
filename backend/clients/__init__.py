"""Service clients for the backend.

One module per external service, each mapped to a single job:

    claude         -> eyes + brain (vision + narration, one call)
    deepgram_stt   -> ears (speech-to-text)
    deepgram_tts   -> voice (text-to-speech)
    redis_client   -> memory + state
    sentry_client  -> reliability

(Overshoot was the old "eyes" client — removed; Claude vision replaced it.
MediaPipe event triggers live in firmware, on-device, not here.)

All stubs for now. See ../README.md.
"""
