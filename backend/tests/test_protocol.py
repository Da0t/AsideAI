"""Pi <-> laptop wire protocol round-trips. Stdlib unittest (no pytest needed).

    python -m unittest backend.tests.test_protocol
"""

import io
import unittest

from backend import protocol


def reader_from(data: bytes):
    """recv_exactly(n) backed by an in-memory buffer; raises EOFError at end."""
    buf = io.BytesIO(data)

    def recv_exactly(n):
        chunk = buf.read(n)
        if len(chunk) < n:
            raise EOFError
        return chunk

    return recv_exactly


class FakeSock:
    """Socket whose recv() returns one byte at a time (exercises partial reads)."""

    def __init__(self, data: bytes):
        self.data = data
        self.i = 0

    def recv(self, n):
        if self.i >= len(self.data):
            return b""
        chunk = self.data[self.i : self.i + 1]
        self.i += 1
        return chunk


class TestProtocol(unittest.TestCase):
    def test_frame_roundtrip(self):
        payload = b"\xff\xd8jpegbytes\xff\xd9"
        wire = protocol.encode(protocol.FRAME, payload)
        mtype, got = protocol.read_message(reader_from(wire))
        self.assertEqual(mtype, protocol.FRAME)
        self.assertEqual(got, payload)

    def test_event_roundtrip(self):
        wire = protocol.encode_event("entrance", True, "entrance")
        mtype, payload = protocol.read_message(reader_from(wire))
        self.assertEqual(mtype, protocol.EVENT)
        self.assertEqual(
            protocol.decode_event(payload),
            {"kind": "entrance", "narrate_now": True, "cue": "entrance"},
        )

    def test_multiple_messages_streamed(self):
        wire = (
            protocol.encode(protocol.FRAME, b"a")
            + protocol.encode_event("wave", False)
            + protocol.encode(protocol.AUDIO, b"pcm")
        )
        r = reader_from(wire)
        self.assertEqual(protocol.read_message(r), (protocol.FRAME, b"a"))
        mtype, payload = protocol.read_message(r)
        self.assertEqual(mtype, protocol.EVENT)
        self.assertEqual(protocol.decode_event(payload)["kind"], "wave")
        self.assertEqual(protocol.read_message(r), (protocol.AUDIO, b"pcm"))

    def test_socket_reader_partial(self):
        wire = protocol.encode(protocol.FRAME, b"hello")
        recv = protocol.socket_reader(FakeSock(wire))
        self.assertEqual(protocol.read_message(recv), (protocol.FRAME, b"hello"))

    def test_empty_payload(self):
        wire = protocol.encode(protocol.AUDIO, b"")
        self.assertEqual(protocol.read_message(reader_from(wire)), (protocol.AUDIO, b""))

    def test_reject_unknown_type(self):
        with self.assertRaises(ValueError):
            protocol.encode(99, b"x")

    def test_eof_on_closed_stream(self):
        with self.assertRaises(EOFError):
            protocol.read_message(reader_from(b""))


if __name__ == "__main__":
    unittest.main()
