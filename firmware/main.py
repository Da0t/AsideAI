"""Firmware entry point.

Wires capture → Overshoot stream + backend audio + keepalive, then runs the
capture loop. Perceive and publish only — no interpretation here.

Flow:
    1. create Overshoot stream (overshoot_stream) -> stream_id, LiveKit creds
    2. start publishing camera video over LiveKit (overshoot_stream)
    3. start streaming mic audio to the backend (mic_capture)
    4. start keepalive pings so the stream stays alive (~5 min TTL) (keepalive)
    5. run until interrupted; clean shutdown

TODO: implement. This is a scaffold stub.
"""

# from . import config
# from . import camera_capture, mic_capture, overshoot_stream, keepalive


def main() -> None:
    # TODO: load config
    # TODO: stream = overshoot_stream.create_stream()   # -> stream_id + LiveKit room/token
    # TODO: overshoot_stream.start_publishing(stream, camera_capture.frames())
    # TODO: mic_capture.start_streaming(to=config.BACKEND_AUDIO_URL)
    # TODO: keepalive.start(stream, interval=config.KEEPALIVE_INTERVAL_SEC)
    # TODO: run loop; handle SIGINT for clean shutdown
    raise NotImplementedError("TODO: firmware main loop")


if __name__ == "__main__":
    main()
