"""Two-tier perception: a cheap, fast change-detector that runs continuously so the
expensive Claude vision call only fires when the SCENE actually changes.

FrameWatcher samples the frame source in a background thread (~watch_fps) and tracks
how much the view has changed since the last *narrated* frame. The live loop blocks
on wait_for_change() instead of polling Claude on a timer:

  - a static room costs nothing (no model calls while nothing happens),
  - a real event (someone enters / moves / reacts) wakes narration within ~1/fps,
  - because it runs in its own thread, it KEEPS WATCHING while the narrator speaks,
    so the moment a line finishes it already has the current situation.

This is the laptop/software stand-in for the Pi's on-device TFLite "narrate now"
trigger (docs/BUILD_ORDER.md step 6) — same idea, cheaper signal.
"""

import threading
import time

from . import frame_source


class FrameWatcher:
    """Continuously samples `source()` (a callable returning JPEG bytes or None) and
    measures change against the last consumed frame."""

    def __init__(self, source, fps: float = 5.0):
        self._source = source
        self._period = 1.0 / max(0.5, fps)
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._thread = None
        self._frame = None      # latest JPEG bytes seen by the watcher
        self._sig = None        # signature of the latest frame
        self._baseline = None   # signature of the last consumed (narrated) frame
        self._wake = threading.Event()  # external "narrate now" nudge (Pi events)

    def start(self) -> "FrameWatcher":
        self._thread = threading.Thread(target=self._run, name="frame-watcher", daemon=True)
        self._thread.start()
        return self

    def stop(self) -> None:
        self._stop.set()

    def wake(self) -> None:
        """Nudge wait_for_change to return immediately on the next poll — used by a
        Pi 'narrate now' event (e.g. someone entered) to interrupt a quiet wait."""
        self._wake.set()

    def _run(self) -> None:
        while not self._stop.is_set():
            try:
                jpeg = self._source()
            except Exception:  # noqa: BLE001 — a flaky read must not kill the watcher
                jpeg = None
            if jpeg:
                sig = frame_source.signature(jpeg)
                with self._lock:
                    self._frame, self._sig = jpeg, sig
            self._stop.wait(self._period)

    def mark_consumed(self) -> None:
        """Anchor change detection to the current frame. Call right after narrating
        (or SKIP-ing) it, so further change is measured from what we just looked at —
        this is what stops us re-asking Claude about an unchanged scene."""
        with self._lock:
            self._baseline = self._sig

    def wait_for_change(self, threshold: float, max_wait: float, poll: float = 0.05):
        """Block until the view changes >= threshold since the last consumed frame,
        or max_wait elapses (a periodic check-in so slow or audio-only moments still
        get a look). Returns (jpeg_or_None, reason):

          'first'   — nothing consumed yet; establish the scene
          'event'   — a Pi 'narrate now' event nudged us (wake())
          'change'  — the view moved enough to be worth a look
          'timeout' — quiet, but the check-in window elapsed
          'blank'   — no usable view (dark/covered/placeholder)
          'stop'    — the watcher was stopped
        """
        start = time.monotonic()
        while not self._stop.is_set():
            with self._lock:
                jpeg, sig, base = self._frame, self._sig, self._baseline
            elapsed = time.monotonic() - start
            have_view = bool(jpeg) and not frame_source._is_blank_sig(sig)
            if self._wake.is_set():            # Pi event nudge — narrate this moment
                self._wake.clear()
                if have_view:
                    return jpeg, "event"
            if have_view:
                if base is None:
                    return jpeg, "first"
                if frame_source.change_score(base, sig) >= threshold:
                    return jpeg, "change"
                if elapsed >= max_wait:
                    return jpeg, "timeout"
            elif elapsed >= 0.4:
                return None, "blank"
            time.sleep(poll)
        return None, "stop"
