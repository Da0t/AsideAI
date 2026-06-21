#!/usr/bin/env python3
"""
Laptop-side frame receiver test for AsideAI.

Verifies the Pi sender is speaking the correct protocol without needing
Claude / Deepgram / Redis API keys. Run this on the laptop BEFORE wiring
up the full backend.

Usage:
    python test_receiver.py               # listen on 0.0.0.0:8765
    python test_receiver.py --port 8765   # explicit port
    python test_receiver.py --save        # also save received JPEGs to ./received/
"""

import argparse
import os
import socket
import struct
import time

# ── Protocol (mirrors backend/protocol.py) ──────────────────────────────────

FRAME = 1
AUDIO = 2
EVENT = 3
_TYPE_NAMES = {FRAME: "FRAME", AUDIO: "AUDIO", EVENT: "EVENT"}
_HEADER = struct.Struct(">BI")  # type u8, length u32 big-endian
MAX_PAYLOAD = 16 * 1024 * 1024


def _recv_exactly(sock: socket.socket, n: int) -> bytes:
    buf = bytearray()
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise EOFError("connection closed")
        buf.extend(chunk)
    return bytes(buf)


def _read_message(sock: socket.socket) -> tuple[int, bytes]:
    header = _recv_exactly(sock, _HEADER.size)
    msg_type, length = _HEADER.unpack(header)
    if length > MAX_PAYLOAD:
        raise ValueError(f"payload too large: {length}")
    payload = _recv_exactly(sock, length) if length else b""
    return msg_type, payload


# ── Main ─────────────────────────────────────────────────────────────────────

def handle(conn: socket.socket, addr, save: bool, save_dir: str) -> None:
    print(f"[connected] {addr}")
    frames = 0
    t_start = time.monotonic()

    try:
        while True:
            msg_type, payload = _read_message(conn)
            name = _TYPE_NAMES.get(msg_type, f"UNKNOWN({msg_type})")
            now = time.monotonic() - t_start

            if msg_type == FRAME:
                frames += 1
                # Validate it's a real JPEG (starts with FF D8)
                is_jpeg = payload[:2] == b"\xff\xd8"
                print(
                    f"  [{now:6.1f}s] FRAME #{frames:4d}  {len(payload):>8,} bytes  "
                    f"{'✓ JPEG' if is_jpeg else '✗ NOT JPEG'}"
                )
                if save and is_jpeg:
                    path = os.path.join(save_dir, f"frame_{frames:04d}.jpg")
                    with open(path, "wb") as f:
                        f.write(payload)
                    print(f"             saved → {path}")

            elif msg_type == AUDIO:
                print(f"  [{now:6.1f}s] AUDIO  {len(payload):>8,} bytes  (PCM s16le mono)")

            elif msg_type == EVENT:
                import json
                ev = json.loads(payload.decode("utf-8"))
                print(f"  [{now:6.1f}s] EVENT  {ev}")

            else:
                print(f"  [{now:6.1f}s] {name}  {len(payload):>8,} bytes  (unknown type)")

    except EOFError:
        elapsed = time.monotonic() - t_start
        fps = frames / elapsed if elapsed > 0 else 0
        print(f"[disconnected] {addr}  —  {frames} frames in {elapsed:.1f}s ({fps:.2f} fps)")
    except Exception as e:
        print(f"[error] {e}")
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="AsideAI frame receiver test")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address")
    parser.add_argument("--port", type=int, default=8765, help="Bind port (must match FIRMWARE_LISTEN)")
    parser.add_argument("--save", action="store_true", help="Save received JPEG frames to ./received/")
    args = parser.parse_args()

    save_dir = os.path.join(os.path.dirname(__file__), "received")
    if args.save:
        os.makedirs(save_dir, exist_ok=True)
        print(f"[init] saving frames to {save_dir}/")

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((args.host, args.port))
    server.listen(1)
    print(f"[ready] Listening on {args.host}:{args.port} — waiting for Pi to connect...")
    print(f"        On the Pi run:  python3 pi_frame_sender.py --host <this-laptop-ip>")
    print()

    try:
        while True:
            conn, addr = server.accept()
            handle(conn, addr, save=args.save, save_dir=save_dir)
    except KeyboardInterrupt:
        print("\n[done]")
    finally:
        server.close()


if __name__ == "__main__":
    main()
