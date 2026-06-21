"""Backend orchestration entry point.

Runs on a LAPTOP on the same LAN as the QNX Pi. Ingests frames/audio/events from
the Pi over TCP, runs the live narration loop (Claude vision -> Deepgram TTS), and
serves the phone over WebSocket. The clients/ modules do the talking; this is the
conductor.

    python -m backend.main --mock              # offline smoke loop (no Pi, no keys)
    python -m backend.main --mock --iterations 6
    python -m backend.main --serve             # bind the Pi TCP socket + phone WS

Mock mode is stdlib-only: no API keys, no pip installs. It proves the loop and
shows all three personalities. Live mode lights up Claude/Deepgram/Redis/Sentry as
their keys/deps become available.
"""

import argparse
import logging
import socketserver
import threading
import time

from .config import config
from . import protocol, prompt_builder, personalities, frame_source
from .clients import claude, deepgram_tts, deepgram_stt, redis_client, sentry_client

log = logging.getLogger("narrator")


# ── Phone channel (laptop -> phone). Real impl is WebSocket; Noop when absent ──

class NoopPhone:
    def broadcast(self, msg: dict) -> None:
        log.debug("phone <- %s", msg.get("type"))

    def broadcast_voice(self, audio: bytes, meta: dict) -> None:
        log.debug("phone <- voice (%d bytes)", len(audio))


# ── Shared state + the live loop ─────────────────────────────────────────────

class Hub:
    """Holds the latest perception state and runs one narration cycle."""

    def __init__(self) -> None:
        self.bundles = personalities.load_all()
        if redis_client.get_active_personality() is None:
            redis_client.set_active_personality(personalities.default_slug(self.bundles))

        self._lock = threading.Lock()
        self.latest_frame = None
        self.audio_buf = bytearray()
        self.pending_event = None
        self.phone = NoopPhone()

    # --- inbound from the Pi (called by the TCP handler) ---

    def on_frame(self, jpeg: bytes) -> None:
        with self._lock:
            self.latest_frame = jpeg

    def on_audio(self, pcm: bytes) -> None:
        with self._lock:
            self.audio_buf.extend(pcm)

    def on_event(self, ev: dict) -> None:
        with self._lock:
            self.pending_event = ev
        cue = ev.get("cue")
        if cue:  # fire the cue to the phone instantly (the cinematic-entrance beat)
            self.phone.broadcast({"type": "cue", "name": cue})

    # --- accessors ---

    def active_bundle(self) -> dict:
        slug = redis_client.get_active_personality() or personalities.default_slug(self.bundles)
        return self.bundles.get(slug) or next(iter(self.bundles.values()))

    def take_frame(self, fallback) -> bytes:
        with self._lock:
            frame = self.latest_frame
        return frame if frame is not None else fallback()

    def take_event(self):
        with self._lock:
            ev, self.pending_event = self.pending_event, None
        return ev

    # --- one narration cycle (timed) ---

    def narrate_once(self, frame: bytes, bundle: dict = None) -> dict:
        t0 = time.monotonic()
        bundle = bundle or self.active_bundle()
        speech = deepgram_stt.latest_transcript()
        history = redis_client.recent_lines()
        prompt = prompt_builder.build(bundle, frame, speech, history)
        t1 = time.monotonic()
        line = claude.narrate(prompt)               # EYES + BRAIN
        t2 = time.monotonic()
        audio = deepgram_tts.speak(line, bundle.get("deepgram_voice", ""))  # VOICE
        t3 = time.monotonic()

        redis_client.append_line(line)
        self.phone.broadcast({"type": "line", "text": line, "personality": bundle.get("slug")})
        self.phone.broadcast_voice(audio, {"format": "audio", "personality": bundle.get("slug")})

        return {
            "line": line,
            "personality": bundle.get("slug", ""),
            "audio_bytes": len(audio),
            "ms": {
                "build": (t1 - t0) * 1000,
                "claude": (t2 - t1) * 1000,
                "tts": (t3 - t2) * 1000,
                "total": (t3 - t0) * 1000,
            },
        }


# ── Pi -> laptop TCP server ──────────────────────────────────────────────────

def make_tcp_server(hub: Hub):
    class Handler(socketserver.BaseRequestHandler):
        def handle(self):
            log.info("firmware connected: %s", self.client_address)
            recv = protocol.socket_reader(self.request)
            try:
                while True:
                    mtype, payload = protocol.read_message(recv)
                    if mtype == protocol.FRAME:
                        hub.on_frame(payload)
                    elif mtype == protocol.AUDIO:
                        hub.on_audio(payload)
                    elif mtype == protocol.EVENT:
                        hub.on_event(protocol.decode_event(payload))
            except (EOFError, ConnectionError):
                log.info("firmware disconnected: %s", self.client_address)

    class Server(socketserver.ThreadingTCPServer):
        allow_reuse_address = True
        daemon_threads = True

    return Server((config.firmware_host, config.firmware_port), Handler)


# ── Modes ────────────────────────────────────────────────────────────────────

def run_mock(iterations: int, image_path: str = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    print(f"[mock] {config.summary()}")
    hub = Hub()
    slugs = list(hub.bundles.keys()) or [""]
    if not slugs[0]:
        print("  (no personalities found in personalities/)")
        return 1
    if image_path:
        frame = frame_source.load_image(image_path)
        print(f"[mock] frame: {image_path} ({len(frame)} bytes)")
    else:
        frame = frame_source.mock_frame()
        print("[mock] frame: built-in placeholder (pass --image PATH for a real photo)")
    print("[mock] same frame, narrated by each personality:\n")
    for i in range(iterations):
        bundle = hub.bundles[slugs[i % len(slugs)]]
        res = hub.narrate_once(frame, bundle=bundle)
        print(f"  {res['personality']:>20} → {res['line']}")
        print(
            f"  {'':>20}   {res['ms']['total']:.0f}ms total "
            f"(claude {res['ms']['claude']:.0f} · tts {res['ms']['tts']:.0f}) "
            f"· {res['audio_bytes']}B audio"
        )
    print("\n[mock] add keys to .env for real Claude/Deepgram; plug in the Pi for real frames.")
    return 0


def _start_phone(hub: Hub):
    """Return a phone channel: a WebSocket server if `websockets` is installed,
    otherwise Noop (logs only). The WS path is the real frontend channel."""
    try:
        from .phone_ws import WebSocketPhone
    except Exception as e:  # noqa: BLE001
        log.info("phone WS unavailable (%s) — phone channel disabled", e)
        return NoopPhone()
    return WebSocketPhone(hub, config.phone_ws_port)


def run_serve() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s: %(message)s")
    sentry_client.init()
    hub = Hub()
    hub.phone = _start_phone(hub)

    server = make_tcp_server(hub)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    log.info("listening for the Pi on %s:%s · %s",
             config.firmware_host, config.firmware_port, config.summary())

    def fallback_frame():
        return frame_source.webcam_frame() or frame_source.mock_frame()

    try:
        while True:
            hub.take_event()  # (events also auto-fire cues on arrival)
            frame = hub.take_frame(fallback_frame)
            res = hub.narrate_once(frame)
            log.info("%s → %s (%.0fms)", res["personality"], res["line"], res["ms"]["total"])
            time.sleep(config.loop_interval_sec)
    except KeyboardInterrupt:
        log.info("shutting down")
        server.shutdown()
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="The Narrator — laptop backend")
    parser.add_argument("--mock", action="store_true",
                        help="offline smoke loop (no Pi, no keys, no installs)")
    parser.add_argument("--serve", action="store_true",
                        help="bind the Pi TCP socket + phone WS and run live")
    parser.add_argument("--iterations", type=int, default=3,
                        help="mock mode: how many narration cycles")
    parser.add_argument("--image", type=str, default=None,
                        help="mock mode: narrate this image file (JPEG/PNG) instead of the placeholder")
    args = parser.parse_args(argv)
    if args.serve:
        return run_serve()
    return run_mock(args.iterations, args.image)  # default = mock


if __name__ == "__main__":
    raise SystemExit(main())
