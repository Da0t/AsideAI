"""The Narrator — laptop backend (orchestrator) package.

Runs on a laptop on the same LAN as the QNX Pi. Ingests frames/audio/events from
the Pi, calls Claude vision + Deepgram, serves the phone. Run it with:

    python -m backend.main --mock      # offline smoke loop (no keys, no installs)
    python -m backend.main --serve     # bind the Pi TCP socket + phone WS, run live
"""
