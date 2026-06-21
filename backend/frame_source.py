"""Where the camera frame comes from.

Three sources, in order of realism:
  1. the QNX Pi over the LAN (the real product) — fed in by main.py's TCP server
  2. a laptop webcam (dev) — `webcam_frame()` if OpenCV is available
  3. a mock placeholder (offline smoke) — `mock_frame()`, stdlib only

A "frame" is just JPEG bytes. In mock mode (no Claude key) the bytes are opaque —
the mock Claude client never decodes them — so a placeholder is fine.
"""

# A 1x1 black JPEG (valid bytes), so even the mock path carries a real image.
_PLACEHOLDER_JPEG = bytes.fromhex(
    "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707"
    "07090908"
    "0a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c283729"
    "2c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffc40014"
    "00010000000000000000000000000000000009ffc4001401010000000000000000"
    "00000000000000000000ffda0008010100003f00d2cf20ffd9"
)


def mock_frame() -> bytes:
    """Return placeholder JPEG bytes (offline smoke)."""
    return _PLACEHOLDER_JPEG


def load_image(path: str) -> bytes:
    """Read an image file (JPEG/PNG) as raw bytes, to use as a frame."""
    with open(path, "rb") as f:
        return f.read()


def signature(jpeg: bytes):
    """A cheap 32x32 grayscale fingerprint of a frame (a flat pixel list), used for
    blank-detection and frame-to-frame change scoring without a model call. Returns
    None if the bytes can't be decoded (PIL missing or a bad frame)."""
    if not jpeg:
        return None
    try:
        import io
        from PIL import Image
        im = Image.open(io.BytesIO(jpeg)).convert("L").resize((32, 32))
        return list(im.getdata())
    except Exception:  # noqa: BLE001 — undecodable: caller decides what to do
        return None


def _is_blank_sig(sig) -> bool:
    """True if a signature is effectively black or uniform. None (undecodable) is
    treated as not-blank, matching is_blank's don't-block-on-failure behavior."""
    if not sig:
        return False
    mean = sum(sig) / len(sig)
    var = sum((p - mean) ** 2 for p in sig) / len(sig)
    return mean < 12 or var < 25  # near-black or near-uniform (very conservative)


def is_blank(jpeg: bytes) -> bool:
    """True if the frame is effectively black or uniform (camera not really
    feeding — covered, warming up, or the placeholder). Used to avoid narrating
    nothing, which makes the model hallucinate.
    """
    if not jpeg:
        return True
    return _is_blank_sig(signature(jpeg))


def change_score(sig_a, sig_b) -> float:
    """How much two signatures differ, 0.0 (identical) .. 1.0, as the mean absolute
    per-pixel delta over 255. A missing/mismatched signature scores 1.0 (treat the
    unknown as fully changed, so we look rather than assume nothing happened)."""
    if not sig_a or not sig_b or len(sig_a) != len(sig_b):
        return 1.0
    total = 0
    for a, b in zip(sig_a, sig_b):
        total += a - b if a > b else b - a
    return total / (len(sig_a) * 255.0)


def color_correct(jpeg: bytes, strength: float = 0.8) -> bytes:
    """Gray-world auto white balance on JPEG bytes.

    Neutralizes a color cast — e.g. the Pi camera's green/blue fluorescent tint —
    so narration describes the true scene instead of fixating on the lighting, and
    the phone's live feed looks natural. `strength` blends original→fully-corrected
    (0 = off, 1 = full); a value below 1 guards against over-correcting scenes that
    are genuinely dominated by one color. Returns the input unchanged on any failure
    (deps missing, undecodable, or a near-black frame) so the loop never breaks.
    """
    if not jpeg or strength <= 0:
        return jpeg
    try:
        import io
        import numpy as np
        from PIL import Image

        im = Image.open(io.BytesIO(jpeg)).convert("RGB")
        arr = np.asarray(im, dtype=np.float32)
        means = arr.reshape(-1, 3).mean(0)
        if float(means.min()) < 1.0:            # a dead channel — don't divide
            return jpeg
        gains = float(means.mean()) / means     # scale each channel toward neutral gray
        gains = 1.0 + (gains - 1.0) * float(strength)   # blend by strength
        arr = np.clip(arr * gains, 0, 255).astype("uint8")
        out = io.BytesIO()
        Image.fromarray(arr, "RGB").save(out, "JPEG", quality=85)
        return out.getvalue()
    except Exception:  # noqa: BLE001 — correction is best-effort; never break the loop
        return jpeg


def webcam_frame():
    """Capture one JPEG from the laptop webcam, or None if OpenCV is unavailable.

    One-shot (opens/closes the camera). For the continuous `--webcam` loop use the
    persistent `Webcam` below — it keeps the camera open across frames.
    """
    cam = open_webcam()
    if cam is None:
        return None
    try:
        return cam.read()
    finally:
        cam.close()


class Webcam:
    """A persistent laptop-webcam frame source: keeps the camera open and yields
    downscaled JPEG frames. Stand-in for the Pi camera until the Pi is wired.
    """

    def __init__(self, index: int, max_dim: int):
        import cv2
        self._cv2 = cv2
        self.cap = cv2.VideoCapture(index)
        self.max_dim = max_dim

    def opened(self) -> bool:
        return bool(self.cap and self.cap.isOpened())

    def _encode(self, frame) -> bytes:
        """Downscale to max_dim on the long edge and JPEG-encode (numpy frame)."""
        h, w = frame.shape[:2]
        scale = self.max_dim / max(h, w)
        if scale < 1.0:
            frame = self._cv2.resize(frame, (int(w * scale), int(h * scale)))
        ok, buf = self._cv2.imencode(".jpg", frame)
        return buf.tobytes() if ok else None

    def read(self):
        """Return a downscaled JPEG from the camera, or None on a bad read."""
        ok, frame = self.cap.read()
        return self._encode(frame) if ok else None

    def close(self) -> None:
        if self.cap:
            self.cap.release()


def open_webcam(index: int = 0, max_dim: int = 768):
    """Open the laptop webcam, or None if OpenCV isn't installed."""
    try:
        import cv2  # noqa: F401  (optional dependency)
    except ImportError:
        return None
    return Webcam(index, max_dim)
