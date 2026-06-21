"""Pi <-> laptop wire protocol (length-prefixed, typed messages). Stdlib only.

This is the firmware <-> backend contract. The Pi (firmware/src/net_client.cpp)
encodes the same shape in C++; the backend decodes it here. See docs/PROTOCOL.md.

On the wire, every message is:

    [1 byte type][4 bytes big-endian uint32 length][length bytes payload]

Types:
    FRAME = 1   payload = JPEG bytes (downscaled)
    AUDIO = 2   payload = raw PCM bytes (s16le, mono)
    EVENT = 3   payload = UTF-8 JSON {"kind","narrate_now","cue"}
"""

from __future__ import annotations

import json
import struct

FRAME = 1
AUDIO = 2
EVENT = 3

_HEADER = struct.Struct(">BI")  # type (uint8), length (uint32 big-endian)
MAX_PAYLOAD = 16 * 1024 * 1024  # 16 MB safety cap


def encode(msg_type: int, payload: bytes) -> bytes:
    """Frame one message for the wire."""
    if msg_type not in (FRAME, AUDIO, EVENT):
        raise ValueError(f"unknown message type {msg_type}")
    if len(payload) > MAX_PAYLOAD:
        raise ValueError(f"payload too large: {len(payload)} > {MAX_PAYLOAD}")
    return _HEADER.pack(msg_type, len(payload)) + payload


def encode_event(kind: str, narrate_now: bool = True, cue: str = "") -> bytes:
    """Frame an EVENT message from its fields."""
    payload = json.dumps(
        {"kind": kind, "narrate_now": narrate_now, "cue": cue}
    ).encode("utf-8")
    return encode(EVENT, payload)


def decode_event(payload: bytes) -> dict:
    """Parse an EVENT payload into {kind, narrate_now, cue}."""
    return json.loads(payload.decode("utf-8"))


def read_message(recv_exactly) -> tuple[int, bytes]:
    """Read one framed message.

    Args:
        recv_exactly: callable (n) -> bytes that returns exactly n bytes or
            raises EOFError when the stream closes.

    Returns:
        (msg_type, payload).
    """
    header = recv_exactly(_HEADER.size)
    msg_type, length = _HEADER.unpack(header)
    if length > MAX_PAYLOAD:
        raise ValueError(f"payload too large: {length} > {MAX_PAYLOAD}")
    payload = recv_exactly(length) if length else b""
    return msg_type, payload


def socket_reader(sock):
    """Return a `recv_exactly(n)` bound to a connected socket (for read_message)."""

    def recv_exactly(n: int) -> bytes:
        buf = bytearray()
        while len(buf) < n:
            chunk = sock.recv(n - len(buf))
            if not chunk:
                raise EOFError("connection closed")
            buf.extend(chunk)
        return bytes(buf)

    return recv_exactly
