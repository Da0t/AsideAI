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
from .watcher import FrameWatcher
from .clients import claude, deepgram_tts, deepgram_stt, redis_client, sentry_client

log = logging.getLogger("narrator")

# Audio the Pi ships over the LAN: s16le mono @ 16 kHz (matches Deepgram STT). The
# Hub keeps a bounded rolling window so STT always sees the most recent few seconds.
PI_AUDIO_RATE = 16000
PI_AUDIO_KEEP_SEC = 10


def _is_skip(line: str) -> bool:
    """True if the model chose to stay silent this round (returned SKIP).

    Conservative: only an empty reply or a 1–2 word reply led by SKIP counts, so a
    real line like "Skipping rope, the kid..." is NOT mistaken for a skip.
    """
    s = (line or "").strip()
    if not s:
        return True
    tokens = s.upper().strip('".!()').split()
    return len(tokens) <= 2 and bool(tokens) and tokens[0] == "SKIP"


def _estimate_speech_seconds(line: str) -> float:
    """Rough spoken duration of a line — used to avoid talking over it when the
    phone (not the laptop) is the speaker."""
    return max(2.0, len(line.split()) * 0.38)


# ── Phone channel (laptop -> phone). Real impl is WebSocket; Noop when absent ──

class NoopPhone:
    def broadcast(self, msg: dict) -> None:
        log.debug("phone <- %s", msg.get("type"))

    def broadcast_voice(self, audio: bytes, meta: dict) -> None:
        log.debug("phone <- voice (%d bytes)", len(audio))

    def broadcast_frame(self, jpeg: bytes, meta: dict) -> None:
        log.debug("phone <- frame (%d bytes)", len(jpeg))


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
        self.spoke_this_session = False  # force an establishing line once per run
        self.watcher = None       # set by the live loop; lets Pi events wake narration
        self.frame_source = None  # "pi" | "local" — origin of the last frame served

    # --- inbound from the Pi (called by the TCP handler) ---

    def on_frame(self, jpeg: bytes) -> None:
        with self._lock:
            self.latest_frame = jpeg

    def on_audio(self, pcm: bytes) -> None:
        with self._lock:
            self.audio_buf.extend(pcm)
            cap = PI_AUDIO_RATE * 2 * PI_AUDIO_KEEP_SEC  # keep only the last ~10s
            if len(self.audio_buf) > cap:
                del self.audio_buf[: len(self.audio_buf) - cap]

    def on_event(self, ev: dict) -> None:
        with self._lock:
            self.pending_event = ev
        cue = ev.get("cue")
        if cue:  # fire the cue to the phone instantly (the cinematic-entrance beat)
            self.phone.broadcast({"type": "cue", "name": cue})
        log.info("Pi event: kind=%s cue=%s narrate_now=%s",
                 ev.get("kind"), cue or "-", ev.get("narrate_now"))
        # "narrate now" interrupts a quiet wait so the line lands on the moment.
        if ev.get("narrate_now") and self.watcher is not None:
            self.watcher.wake()

    # --- accessors ---

    def active_bundle(self) -> dict:
        slug = redis_client.get_active_personality() or personalities.default_slug(self.bundles)
        return self.bundles.get(slug) or next(iter(self.bundles.values()))

    def take_frame(self, fallback) -> bytes:
        """Latest Pi frame if one has arrived, else the local fallback (laptop webcam,
        or None in Pi-only mode). Records which source supplied it for logging."""
        with self._lock:
            frame = self.latest_frame
        if frame is not None:
            self.frame_source = "pi"
            return frame
        self.frame_source = "local"
        return fallback()

    def clear_frame(self) -> None:
        """Drop the last Pi frame (on disconnect) so we don't narrate a stale view."""
        with self._lock:
            self.latest_frame = None

    def take_event(self):
        with self._lock:
            ev, self.pending_event = self.pending_event, None
        return ev

    def take_audio(self, seconds: float) -> bytes:
        """Most recent `seconds` of audio the Pi has streamed (b'' if none yet)."""
        n = int(PI_AUDIO_RATE * seconds) * 2
        with self._lock:
            return bytes(self.audio_buf[-n:]) if self.audio_buf else b""

    # --- one narration cycle (timed) ---

    def narrate_once(self, frame: bytes, bundle: dict = None, decide: bool = False,
                     reason: str = None) -> dict:
        """Look at the frame and (optionally) decide whether to speak.

        With decide=True the model may return SKIP — in which case nothing is
        voiced or broadcast (the narrator just keeps observing). `reason` is why we
        looked ('change'/'first'/'timeout'): a 'timeout' is a quiet check-in on an
        unchanged scene, so the model biases to SKIP. Returns a dict with `spoke`
        (bool) and, when spoken, the line.
        """
        t0 = time.monotonic()
        bundle = bundle or self.active_bundle()
        speech = deepgram_stt.latest_transcript()
        history = redis_client.recent_lines()
        # Always speak the first line of THIS session (establish the scene), then
        # become selective. Keyed on the session — NOT on Redis history being empty,
        # since persistent memory across runs would otherwise suppress the opener and
        # the narrator sits silent at startup.
        if not self.spoke_this_session:
            decide = False
        static = reason == "timeout"   # quiet check-in, not a real change -> bias quiet
        prompt = prompt_builder.build(bundle, frame, speech, history,
                                      decide=decide, static=static)
        t1 = time.monotonic()
        line = claude.narrate(prompt)               # EYES + BRAIN (or "SKIP")
        t2 = time.monotonic()

        spoke = not (decide and _is_skip(line))
        audio = b""
        if spoke:
            audio = deepgram_tts.speak(line, bundle.get("deepgram_voice", ""))  # VOICE
            t3 = time.monotonic()
            if self.play_audio:
                audio_out.play(audio)  # blocks until the line finishes speaking
            redis_client.append_line(line)
            self.spoke_this_session = True  # opener delivered; selective from here
            self.phone.broadcast({"type": "line", "text": line, "personality": bundle.get("slug")})
            self.phone.broadcast_voice(audio, {"personality": bundle.get("slug")})
        else:
            t3 = t2

        return {
            "spoke": spoke,
            "line": line if spoke else None,
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
            got_frame = False
            try:
                while True:
                    mtype, payload = protocol.read_message(recv)
                    if mtype == protocol.FRAME:
                        if not got_frame:
                            log.info("📷 receiving camera frames from Pi %s — using the Pi camera",
                                     self.client_address)
                            got_frame = True
                        hub.on_frame(payload)
                    elif mtype == protocol.AUDIO:
                        hub.on_audio(payload)
                    elif mtype == protocol.EVENT:
                        hub.on_event(protocol.decode_event(payload))
            except (EOFError, ConnectionError):
                log.info("firmware disconnected: %s", self.client_address)
            finally:
                hub.clear_frame()  # stop using the Pi's last (now stale) frame

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


def _start_rolling_mic(use_mic: bool):
    """A background rolling-mic capture, or None. Listening this way never blocks the
    visual change-detector (unlike record(), which stalls the loop for its window)."""
    if not use_mic:
        return None
    if not mic.available():
        log.info("mic requested but unavailable (pip install sounddevice) — vision only")
        return None
    try:
        return mic.RollingMic().start()
    except Exception as e:  # noqa: BLE001 — no mic shouldn't take the loop down
        log.info("mic capture failed to start (%s) — vision only", e)
        return None


def _resolve_threshold(sensitivity):
    """CLI --sensitivity overrides the configured change threshold (clamped 0..1)."""
    if sensitivity is None:
        return config.change_threshold
    return max(0.0, min(1.0, sensitivity))


def _resolve_awb(strength):
    """CLI --awb-strength overrides the configured white-balance strength (0..1)."""
    if strength is None:
        return config.awb_strength
    return max(0.0, min(1.0, strength))


def _live_loop(hub: "Hub", watcher: FrameWatcher, *, bundle: dict = None,
               rolling=None, observe_gap: float, change_threshold: float,
               quiet_checkin: float, label: str = "live") -> None:
    """The two-tier narration loop shared by --serve and --webcam.

    Blocks on the cheap change-detector and only wakes Claude on a real change (or a
    periodic check-in). The watcher keeps sampling in its own thread, so we keep
    watching while we speak and have the current situation ready the instant a line
    ends. Raises KeyboardInterrupt up to the caller, which owns cleanup.
    """
    no_view = False
    while True:
        if not hub.running:               # phone paused narration
            time.sleep(0.15)
            continue
        frame, reason = watcher.wait_for_change(change_threshold, quiet_checkin)
        if reason == "stop":
            break
        if reason == "blank" or not frame or frame_source.is_blank(frame):
            if not no_view:
                log.info("[%s] no usable view (camera dark/blank) — waiting for a real frame", label)
                no_view = True
            time.sleep(0.4)
            continue
        if no_view:
            log.info("[%s] view restored", label)
            no_view = False
        # Audio: prefer the Pi's mic stream when it's feeding, else the laptop mic.
        pi_audio = hub.take_audio(4.0)
        if pi_audio:
            audio, asrc = pi_audio, "pi"
        elif rolling is not None:
            audio, asrc = rolling.recent(4.0), "mic"
        else:
            audio, asrc = b"", None
        if asrc is not None:              # refresh the transcript from captured audio
            buffered = len(audio) / (PI_AUDIO_RATE * 2.0)
            heard = deepgram_stt.transcribe(audio)
            if buffered < 0.5:
                log.warning("🎤 [%s] only %.1fs buffered — audio capture may not be "
                            "working (check mic permission / device)", asrc, buffered)
            elif heard:
                log.info("🎤 [%s] heard: %r  (%.1fs in buffer)", asrc, heard, buffered)
            else:
                log.info("🎤 [%s] no speech  (%.1fs in buffer)", asrc, buffered)
        res = hub.narrate_once(frame, bundle=bundle, decide=True, reason=reason)
        watcher.mark_consumed()           # measure further change from what we just saw
        if res["spoke"]:
            log.info("%s → %s (%.0fms · %s · cam=%s)", res["personality"], res["line"],
                     res["ms"]["total"], reason, hub.frame_source)
            # Don't start the next line until this one has been spoken.
            wait = observe_gap if hub.play_audio else (
                _estimate_speech_seconds(res["line"]) + observe_gap)
            time.sleep(wait)
        # On SKIP: no sleep — wait_for_change already blocks until the next change.


def run_webcam(personality_slug: str = None, interval: float = None,
               play: bool = True, use_mic: bool = False,
               sensitivity: float = None, awb_strength: float = None) -> int:
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

    hub = Hub()
    hub.play_audio = play
    bundle = hub.bundles.get(personality_slug) if personality_slug else None
    active = (bundle or hub.active_bundle()).get("slug")

    # Confirm we can actually read frames (camera permission / device index) so a
    # denied camera fails loudly instead of spinning silently. Probe BEFORE the
    # watcher starts, so the watcher thread is the only one touching the camera.
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

    rolling = _start_rolling_mic(use_mic)
    change_threshold = _resolve_threshold(sensitivity)
    awb = _resolve_awb(awb_strength)
    observe_gap = 0.4 if interval is None else interval
    watcher = FrameWatcher(lambda: frame_source.color_correct(cam.read(), awb),
                           fps=config.watch_fps).start()
    hub.watcher = watcher

    mic_note = f" · 🎤 mic ON ({mic.device_name()})" if rolling is not None else ""
    print(f"[webcam] narrating live · personality={active} · change-gated "
          f"(sensitivity={change_threshold:.3f}, {config.watch_fps:.0f}fps, "
          f"check-in {config.quiet_checkin_sec:.0f}s){mic_note} · Ctrl-C to quit\n")
    try:
        _live_loop(hub, watcher, bundle=bundle, rolling=rolling,
                   observe_gap=observe_gap, change_threshold=change_threshold,
                   quiet_checkin=config.quiet_checkin_sec, label="webcam")
    except KeyboardInterrupt:
        print("\n[webcam] bye.")
    finally:
        watcher.stop()
        if rolling is not None:
            rolling.stop()
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


def run_serve(play: bool = False, use_mic: bool = False, interval: float = None,
              sensitivity: float = None, no_webcam: bool = False,
              awb_strength: float = None) -> int:
    """The live phone-connected mode: serve the phone WS + the Pi TCP socket, and
    narrate from the Pi (when connected) or the laptop webcam.

    Change-gated (two-tier): a cheap watcher samples the view continuously and only
    wakes the Claude vision call when the scene actually changes — so it reacts to
    real events within ~1/fps instead of polling on a timer, costs nothing on a
    static scene, and keeps watching while it speaks. The model still decides whether
    a change is worth a line (SKIP otherwise). The phone switches personality/mode,
    sees the live line, plays the voice, and pauses/resumes. --play also speaks on the
    laptop (else the phone is the speaker); --sensitivity tunes the change threshold.

    By default the laptop webcam is a fallback until the Pi sends frames. --no-webcam
    is Pi-ONLY: it never opens the laptop camera and just waits for Pi frames — use it
    on the wearable so the laptop's view can't silently stand in for the Pi camera.
    """
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s: %(message)s")
    sentry_client.init()
    hub = Hub()
    hub.play_audio = play
    hub.phone = _start_phone(hub)

    server = make_tcp_server(hub)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    # Laptop webcam as a local stand-in until the Pi sends frames — unless --no-webcam
    # (Pi-only: never touch the laptop camera; wait for the Pi).
    cam = None if no_webcam else frame_source.open_webcam(max_dim=config.frame_max_dim)
    if cam is not None and not cam.opened():
        cam.close()
        cam = None

    rolling = _start_rolling_mic(use_mic)
    change_threshold = _resolve_threshold(sensitivity)
    awb = _resolve_awb(awb_strength)
    observe_gap = 0.4 if interval is None else interval  # small beat after each line

    def local_frame():
        return cam.read() if cam is not None else None   # a real frame, or None

    # Pi frame if present, else webcam — white-balanced once here, so Claude, the
    # phone feed, and change-detection all see the color-corrected frame.
    def source():
        return frame_source.color_correct(hub.take_frame(local_frame), awb)

    watcher = FrameWatcher(source, fps=config.watch_fps).start()
    hub.watcher = watcher  # let Pi "narrate now" events wake the loop

    # Forward the live camera feed to the phone's Vision screen, throttled. Reuses the
    # watcher's latest frame + signature (no extra decode) and skips blank frames.
    fwd_stop = threading.Event()

    def _forward_frames():
        period = 1.0 / max(1.0, config.phone_frame_fps)
        while not fwd_stop.is_set():
            jpeg, sig = watcher.current()
            if jpeg and not frame_source._is_blank_sig(sig):
                hub.phone.broadcast_frame(jpeg, {})
            fwd_stop.wait(period)

    threading.Thread(target=_forward_frames, name="phone-frame-forwarder", daemon=True).start()

    cam_mode = "off (Pi-only)" if no_webcam else ("fallback" if cam else "unavailable")
    log.info("phone WS on :%s · Pi on %s:%s · laptop-cam=%s mic=%s · live-feed=%.0ffps · "
             "awb=%.2f · change-gated (thr=%.3f, %.0ffps, check-in %.0fs) · %s",
             config.phone_ws_port, config.firmware_host, config.firmware_port,
             cam_mode, "on" if rolling is not None else "off", config.phone_frame_fps,
             awb, change_threshold, config.watch_fps, config.quiet_checkin_sec, config.summary())
    if no_webcam:
        log.info("Pi-only mode: waiting for camera frames from the Pi on "
                 "%s:%s …", config.firmware_host, config.firmware_port)

    try:
        _live_loop(hub, watcher, rolling=rolling, observe_gap=observe_gap,
                   change_threshold=change_threshold,
                   quiet_checkin=config.quiet_checkin_sec, label="serve")
    except KeyboardInterrupt:
        log.info("shutting down")
    finally:
        fwd_stop.set()
        watcher.stop()
        if rolling is not None:
            rolling.stop()
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
    parser.add_argument("--mic", action=argparse.BooleanOptionalAction, default=True,
                        help="webcam/serve: capture mic audio (in-memory only) and react to "
                             "what's heard — ON by default; use --no-mic to disable")
    parser.add_argument("--serve", action="store_true",
                        help="bind the Pi TCP socket + phone WS and run live")
    parser.add_argument("--no-webcam", action="store_true",
                        help="serve mode: Pi-ONLY — never use the laptop camera, only the Pi's frames")
    parser.add_argument("--play", action="store_true",
                        help="play narration out loud on this laptop (afplay)")
    parser.add_argument("--image", type=str, default=None,
                        help="narrate this image file (JPEG/PNG) instead of the placeholder")
    parser.add_argument("--personality", type=str, default=None,
                        help="talk mode: which personality (slug); default = active")
    parser.add_argument("--seconds", type=float, default=5.0,
                        help="talk mode: mic record length per turn")
    parser.add_argument("--interval", type=float, default=None,
                        help="webcam/serve: small beat after each spoken line (default 0.4s)")
    parser.add_argument("--sensitivity", type=float, default=None,
                        help="webcam/serve: motion threshold 0-1 — LOWER reacts to smaller "
                             "changes (more narration), higher = only big events (default CHANGE_THRESHOLD)")
    parser.add_argument("--awb-strength", type=float, default=None,
                        help="webcam/serve: auto white-balance strength 0-1 (0=off, 1=full) — "
                             "neutralizes the camera's color cast (default AWB_STRENGTH=0.8)")
    parser.add_argument("--iterations", type=int, default=3,
                        help="mock mode: how many narration cycles")
    args = parser.parse_args(argv)
    if args.talk:
        return run_talk(args.personality, args.image, args.seconds)
    if args.webcam:
        return run_webcam(args.personality, args.interval, use_mic=args.mic,
                          sensitivity=args.sensitivity, awb_strength=args.awb_strength)
    if args.serve:
        return run_serve(play=args.play, use_mic=args.mic, interval=args.interval,
                         sensitivity=args.sensitivity, no_webcam=args.no_webcam,
                         awb_strength=args.awb_strength)
    return run_mock(args.iterations, args.image, play=args.play)  # default = mock


if __name__ == "__main__":
    raise SystemExit(main())
