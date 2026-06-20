"""Service clients for the backend.

One module per external service, each mapped to a single job:

    overshoot      -> vision / eyes (scene description)
    deepgram_stt   -> ears (speech-to-text)
    deepgram_tts   -> voice (text-to-speech)
    claude         -> brain (short in-character narration)
    redis_client   -> memory + state
    sentry_client  -> reliability

All stubs for now. See ../README.md.
"""
