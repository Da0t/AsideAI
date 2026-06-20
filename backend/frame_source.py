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


def webcam_frame():
    """Capture one JPEG from the laptop webcam, or None if OpenCV is unavailable.

    Dev convenience for testing the loop with a real image before the Pi is wired.
    """
    try:
        import cv2  # optional dependency (opencv-python)
    except ImportError:
        return None
    cap = cv2.VideoCapture(0)
    try:
        ok, frame = cap.read()
        if not ok:
            return None
        ok, buf = cv2.imencode(".jpg", frame)
        return buf.tobytes() if ok else None
    finally:
        cap.release()
