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
from . import protocol, prompt_builder, personalities, frame_source, audio_out, mic
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
        if redis_client.get_mode() is None:
            redis_client.set_mode("chatty")

        self._lock = threading.Lock()
        self.latest_frame = None
        self.audio_buf = bytearray()
        self.pending_event = None
        self.phone = NoopPhone()
        self.play_audio = False  # play narration out loud on this laptop (afplay)
        self.running = True       # phone can pause/resume narration (set_running)

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

        if self.play_audio:
            audio_out.play(audio)  # blocks until the line finishes speaking
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

def run_mock(iterations: int, image_path: str = None, play: bool = False) -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    print(f"[mock] {config.summary()}")
    hub = Hub()
    hub.play_audio = play
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


def run_talk(personality_slug: str = None, image_path: str = None,
             seconds: float = 5.0) -> int:
    """Interactive: talk into the laptop mic (Snowball if present), it talks back.

    Push-to-talk: press Enter, speak for `seconds`, and it narrates back out loud
    in character. Pass --image to also give it something to see; otherwise it just
    responds to what you say.
    """
    logging.basicConfig(level=logging.WARNING, format="%(message)s")  # quiet client logs
    print(f"[talk] {config.summary()}")
    if not mic.available():
        print("[talk] no mic capture available — `pip install sounddevice`.")
        return 1
    if not (config.has_anthropic and config.has_deepgram):
        print("[talk] heads-up: ANTHROPIC/DEEPGRAM keys missing — replies will be mock/silent.")

    hub = Hub()
    hub.play_audio = True
    bundle = hub.bundles.get(personality_slug) if personality_slug else None
    bundle = bundle or hub.active_bundle()
    frame = frame_source.load_image(image_path) if image_path else None

    print(f"[talk] personality = {bundle.get('slug')}  ·  voice = {bundle.get('deepgram_voice')}")
    print(f"[talk] mic = {mic.device_name()}")
    print(f"[talk] seeing = {('image: ' + image_path) if image_path else 'nothing (voice-only; pass --image for vision)'}")
    print("[talk] Press Enter to speak, Ctrl-C to quit.\n")
    try:
        while True:
            input("  [Enter] to talk… ")
            print(f"  🎤 listening {seconds:.0f}s — speak now…")
            pcm = mic.record(seconds)
            transcript = deepgram_stt.transcribe(pcm)
            print(f'  you: "{transcript or "(nothing heard)"}"')
            res = hub.narrate_once(frame, bundle=bundle)  # speech pulled from STT
            print(f"  {bundle.get('slug')}: {res['line']}")
            print(f"  ({res['ms']['total']:.0f}ms · {res['audio_bytes']}B)\n")
    except KeyboardInterrupt:
        print("\n[talk] bye.")
    return 0


def run_webcam(personality_slug: str = None, interval: float = None,
               play: bool = True, use_mic: bool = False) -> int:
    """Continuously narrate what the LAPTOP WEBCAM sees, out loud.

    A stand-in for the Pi camera until it's wired — watch it narrate live. With
    use_mic, it also LISTENS each round (Snowball/laptop mic -> STT) so it reacts
    to what you say while it watches. Same Hub/loop the Pi feeds; only the sources
    differ.
    """
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    print(f"[webcam] {config.summary()}")
    cam = frame_source.open_webcam(max_dim=config.frame_max_dim)
    if cam is None:
        print("[webcam] OpenCV not installed — `pip install opencv-python`.")
        return 1
    if not cam.opened():
        print("[webcam] couldn't open the camera (grant camera permission, or check the index).")
        cam.close()
        return 1
    if not (config.has_anthropic and config.has_deepgram):
        print("[webcam] heads-up: ANTHROPIC/DEEPGRAM keys missing — narration will be mock/silent.")
    if use_mic and not mic.available():
        print("[webcam] mic requested but unavailable (`pip install sounddevice`) — webcam only.")
        use_mic = False

    hub = Hub()
    hub.play_audio = play
    bundle = hub.bundles.get(personality_slug) if personality_slug else None
    interval = config.loop_interval_sec if interval is None else interval

    active = (bundle or hub.active_bundle()).get("slug")
    # Confirm we can actually read frames (camera permission / device index) so a
    # denied camera fails loudly instead of spinning silently.
    probe = None
    for _ in range(20):
        probe = cam.read()
        if probe:
            break
        time.sleep(0.1)
    if not probe:
        print("[webcam] camera opened but returned no frames.")
        print("         Grant Camera permission to your terminal app:")
        print("         System Settings → Privacy & Security → Camera, then retry.")
        cam.close()
        return 1

    mic_note = f" · 🎤 mic ON ({mic.device_name()}) — talk while it watches" if use_mic else ""
    print(f"[webcam] narrating live · personality={active} · every ~{interval:.1f}s{mic_note} · Ctrl-C to quit\n")
    try:
        while True:
            if use_mic:
                print(f"  🎤 listening {interval:.0f}s…", flush=True)
                heard = deepgram_stt.transcribe(mic.record(interval))  # blocks ~interval
                if heard:
                    print(f'  you: "{heard}"')
            frame = cam.read()
            if not frame:
                time.sleep(0.1)
                continue
            b = bundle or hub.active_bundle()
            print("  🔊 speaking…", flush=True)
            res = hub.narrate_once(frame, bundle=b)   # plays out loud (afplay blocks)
            print(f"  {res['personality']}: {res['line']}  ({res['ms']['total']:.0f}ms)")
            if not use_mic:
                time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[webcam] bye.")
    finally:
        try:
            cam.close()
        except Exception:  # noqa: BLE001 — don't dump a traceback on Ctrl-C during shutdown
            pass
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


def run_serve(play: bool = False, use_mic: bool = False, interval: float = None) -> int:
    """The live phone-connected mode: serve the phone WS + the Pi TCP socket, and
    narrate continuously from the Pi (when connected) or the laptop webcam.

    The phone switches personality/mode, sees the live line, plays the voice, and
    pauses/resumes (set_running). Frames come from the Pi if present, else a
    persistent laptop webcam. Default cadence is back-to-back (realtime); pass
    --interval to add a gap. --play also speaks on the laptop (else the phone is
    the speaker).
    """
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s: %(message)s")
    sentry_client.init()
    hub = Hub()
    hub.play_audio = play
    hub.phone = _start_phone(hub)

    server = make_tcp_server(hub)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    # Persistent laptop webcam as the local stand-in until the Pi sends frames.
    cam = frame_source.open_webcam(max_dim=config.frame_max_dim)
    if cam is not None and not cam.opened():
        cam.close()
        cam = None
    if use_mic and not mic.available():
        log.info("mic requested but unavailable (pip install sounddevice) — vision only")
        use_mic = False
    gap = 0.0 if interval is None else interval  # default: narrate back-to-back

    log.info("phone WS on :%s · Pi on %s:%s · webcam=%s mic=%s · %s",
             config.phone_ws_port, config.firmware_host, config.firmware_port,
             "on" if cam else "off", "on" if use_mic else "off", config.summary())

    def local_frame():
        if cam is not None:
            f = cam.read()
            if f:
                return f
        return frame_source.mock_frame()

    try:
        while True:
            if not hub.running:           # phone paused narration
                time.sleep(0.15)
                continue
            if use_mic:
                deepgram_stt.transcribe(mic.record(gap if gap > 0 else 4.0))
            hub.take_event()              # (events also auto-fire cues on arrival)
            frame = hub.take_frame(local_frame)   # Pi frame if present, else webcam
            res = hub.narrate_once(frame)         # broadcasts line + voice to the phone
            log.info("%s → %s (%.0fms)", res["personality"], res["line"], res["ms"]["total"])
            if not use_mic and gap > 0:
                time.sleep(gap)
    except KeyboardInterrupt:
        log.info("shutting down")
    finally:
        if cam is not None:
            cam.close()
        server.shutdown()
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="The Narrator — laptop backend")
    parser.add_argument("--mock", action="store_true",
                        help="offline smoke loop (no Pi, no keys, no installs)")
    parser.add_argument("--talk", action="store_true",
                        help="interactive: talk into the laptop mic, it talks back out loud")
    parser.add_argument("--webcam", action="store_true",
                        help="continuously narrate the laptop webcam out loud (Pi-camera stand-in)")
    parser.add_argument("--mic", action="store_true",
                        help="with --webcam: also listen each round (talk to it while it watches)")
    parser.add_argument("--serve", action="store_true",
                        help="bind the Pi TCP socket + phone WS and run live")
    parser.add_argument("--play", action="store_true",
                        help="play narration out loud on this laptop (afplay)")
    parser.add_argument("--image", type=str, default=None,
                        help="narrate this image file (JPEG/PNG) instead of the placeholder")
    parser.add_argument("--personality", type=str, default=None,
                        help="talk mode: which personality (slug); default = active")
    parser.add_argument("--seconds", type=float, default=5.0,
                        help="talk mode: mic record length per turn")
    parser.add_argument("--interval", type=float, default=None,
                        help="webcam mode: seconds between narrations (default LOOP_INTERVAL_SEC)")
    parser.add_argument("--iterations", type=int, default=3,
                        help="mock mode: how many narration cycles")
    args = parser.parse_args(argv)
    if args.talk:
        return run_talk(args.personality, args.image, args.seconds)
    if args.webcam:
        return run_webcam(args.personality, args.interval, use_mic=args.mic)
    if args.serve:
        return run_serve(play=args.play, use_mic=args.mic, interval=args.interval)
    return run_mock(args.iterations, args.image, play=args.play)  # default = mock


if __name__ == "__main__":
    raise SystemExit(main())
