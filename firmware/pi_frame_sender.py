#!/usr/bin/env python3
"""
Pi-side frame sender for AsideAI.

Runs ON the QNX Pi (as ROOT — screenshot + viewfinder need it). Captures JPEG
frames from Camera Module 3 via the QNX viewfinder + screenshot, then streams
them to the laptop backend over TCP using the AsideAI wire protocol
(backend/protocol.py).

No third-party Python deps: BMP is parsed with the stdlib and JPEG-encoded by
`cjpeg` (libjpeg-turbo-utils). Install once on the Pi:
    sudo apk add libjpeg-turbo-utils

Usage (on the Pi, AS ROOT):
    sudo python3 pi_frame_sender.py --host <laptop-ip> --port 8765 --interval 2.0

Protocol (mirrors backend/protocol.py exactly):
    [1 byte type=FRAME][4 bytes big-endian uint32 length][JPEG bytes]
"""

import argparse
import os
import socket
import struct
import subprocess
import sys
import time

# ── Protocol (mirrors backend/protocol.py) ──────────────────────────────────

FRAME = 1
_HEADER = struct.Struct(">BI")  # type u8, length u32 big-endian


def _encode_frame(jpeg: bytes) -> bytes:
    return _HEADER.pack(FRAME, len(jpeg)) + jpeg


# ── BMP (32/24-bit) → PPM (stdlib only) ──────────────────────────────────────

def _bmp_to_ppm(data: bytes) -> bytes:
    """Convert raw BMP bytes (as written by QNX `screenshot`) to PPM (P6) bytes.

    Handles 24- and 32-bit BMPs with a BITMAPINFOHEADER or BITMAPV4/V5 header,
    bottom-up or top-down. Uses C-level strided slice assignment (fast — no
    per-pixel Python loop).
    """
    if data[:2] != b"BM":
        raise ValueError("not a BMP")
    pixel_offset = struct.unpack_from("<I", data, 10)[0]
    width = struct.unpack_from("<i", data, 18)[0]
    height = struct.unpack_from("<i", data, 22)[0]
    bitcount = struct.unpack_from("<H", data, 28)[0]
    if bitcount not in (24, 32):
        raise ValueError(f"unsupported BMP bitcount {bitcount}")

    top_down = height < 0
    h = abs(height)
    bytespp = bitcount // 8
    row_size = ((bitcount * width + 31) // 32) * 4  # padded to 4-byte boundary

    # Extract R/G/B planes from the (BGR[A]) pixel data with strided slices.
    stride_out = width * 3
    rows = []
    for row in range(h):
        base = pixel_offset + row * row_size
        px = data[base:base + width * bytespp]
        out_row = bytearray(stride_out)
        out_row[0::3] = px[2::bytespp]  # R
        out_row[1::3] = px[1::bytespp]  # G
        out_row[2::3] = px[0::bytespp]  # B
        rows.append(out_row)

    if not top_down:           # BMP rows are bottom-up by default → flip
        rows.reverse()

    header = b"P6\n%d %d\n255\n" % (width, h)
    return header + b"".join(rows)


def _ppm_to_jpeg(ppm: bytes, quality: int) -> bytes:
    """Encode PPM bytes to JPEG via cjpeg (stdin → stdout)."""
    proc = subprocess.run(
        ["cjpeg", "-quality", str(quality)],
        input=ppm,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"cjpeg failed: {proc.stderr.decode(errors='replace').strip()}")
    return proc.stdout


# ── JPEG capture ─────────────────────────────────────────────────────────────

def capture_frame(tmp_bmp: str, quality: int) -> bytes | None:
    """Capture one JPEG frame: screenshot → BMP → PPM → cjpeg → JPEG bytes."""
    result = subprocess.run(
        ["screenshot", f"-file={tmp_bmp}"],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    if result.returncode != 0 or not os.path.exists(tmp_bmp):
        print(f"[capture] screenshot failed: {result.stderr.decode(errors='replace').strip()}",
              file=sys.stderr)
        return None
    try:
        with open(tmp_bmp, "rb") as f:
            bmp = f.read()
        return _ppm_to_jpeg(_bmp_to_ppm(bmp), quality)
    except Exception as e:
        print(f"[capture] encode failed: {e}", file=sys.stderr)
        return None


# ── TCP connection with auto-reconnect ───────────────────────────────────────

def _connect(host: str, port: int, retry_delay: float = 5.0) -> socket.socket:
    while True:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((host, port))
            sock.settimeout(None)
            print(f"[net] connected to backend at {host}:{port}")
            return sock
        except OSError as e:
            print(f"[net] connection failed ({e}), retrying in {retry_delay:.0f}s...")
            time.sleep(retry_delay)


# ── Main loop ────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="AsideAI Pi frame sender")
    parser.add_argument("--host", default="172.20.10.9", help="Laptop backend IP")
    parser.add_argument("--port", type=int, default=8765, help="Backend port (FIRMWARE_LISTEN)")
    parser.add_argument("--interval", type=float, default=2.0, help="Seconds between frames")
    parser.add_argument("--quality", type=int, default=85, help="JPEG quality (1-100)")
    parser.add_argument("--no-viewfinder", action="store_true",
                        help="Don't launch the viewfinder (if already running)")
    args = parser.parse_args()

    # Preflight: cjpeg present?
    if subprocess.run(["which", "cjpeg"], stdout=subprocess.DEVNULL).returncode != 0:
        print("[init] cjpeg not found. Install:  sudo apk add libjpeg-turbo-utils", file=sys.stderr)
        return 1

    # Start the viewfinder (keeps the live camera feed on screen for screenshot).
    viewfinder = None
    if not args.no_viewfinder:
        print("[init] Starting camera viewfinder (unit 1)...")
        viewfinder = subprocess.Popen(
            ["camera_example3_viewfinder", "-u", "1"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        time.sleep(4)  # let it open + start streaming
        print("[init] Viewfinder ready.")

    tmp_bmp = "/tmp/pi_sender_frame.bmp"
    frames_sent = 0

    try:
        while True:
            sock = _connect(args.host, args.port, retry_delay=5.0)
            try:
                while True:
                    t0 = time.monotonic()
                    jpeg = capture_frame(tmp_bmp, args.quality)
                    if jpeg is None:
                        time.sleep(1.0)
                        continue
                    sock.sendall(_encode_frame(jpeg))
                    frames_sent += 1
                    elapsed = time.monotonic() - t0
                    print(f"[frame {frames_sent}] {len(jpeg):,} B JPEG  "
                          f"capture+send={elapsed*1000:.0f}ms")
                    time.sleep(max(0.0, args.interval - elapsed))
            except (BrokenPipeError, ConnectionResetError, OSError) as e:
                print(f"[net] lost connection ({e}), reconnecting...")
                try:
                    sock.close()
                except Exception:
                    pass
    except KeyboardInterrupt:
        print(f"\n[done] {frames_sent} frames sent. Shutting down.")
    finally:
        if viewfinder is not None:
            viewfinder.terminate()
    return 0


if __name__ == "__main__":
    sys.exit(main())
