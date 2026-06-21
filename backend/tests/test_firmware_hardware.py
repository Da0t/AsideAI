"""Firmware <-> backend integration — REQUIRES the QNX Pi hardware in the loop.

This is hardware-in-the-loop on purpose: there is no laptop simulator. It binds the
firmware ingest port and waits for a REAL QNX Pi (running firmware/pi_frame_sender.py
or the C++ firmware) to connect over the LAN and stream the wire protocol. It asserts
a genuine connection arrives and at least one valid JPEG FRAME is received, and reports
any AUDIO/EVENT messages it sees.

It is SKIPPED unless you explicitly opt in, because it cannot pass without the Pi:

    # 1. on this laptop:
    ASIDE_HW_TEST=1 python -m unittest backend.tests.test_firmware_hardware
    # 2. then power on the Pi and start the sender pointed at this laptop's IP:
    #    sudo python3 pi_frame_sender.py --host <laptop-ip> --port 8765

Tunables (env): ASIDE_HW_TEST=1 to enable · ASIDE_HW_WAIT=<seconds> connect/stream
window (default 60). Run this standalone — don't run the backend at the same time, as
both bind the firmware port.
"""

import os
import socket
import time
import unittest

from backend import protocol
from backend.config import config

_HW = os.environ.get("ASIDE_HW_TEST") == "1"
_WAIT = float(os.environ.get("ASIDE_HW_WAIT", "60"))


@unittest.skipUnless(_HW, "requires QNX Pi hardware — set ASIDE_HW_TEST=1 (and start the Pi sender)")
class TestFirmwareHardware(unittest.TestCase):
    def test_pi_connects_and_streams_frames(self):
        srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        srv.bind((config.firmware_host, config.firmware_port))
        srv.listen(1)
        srv.settimeout(_WAIT)
        print(f"\n[hw] waiting up to {_WAIT:.0f}s for the QNX Pi on "
              f"{config.firmware_host}:{config.firmware_port} …")
        try:
            try:
                conn, addr = srv.accept()
            except socket.timeout:
                self.fail(f"no QNX Pi connected within {_WAIT:.0f}s — is the Pi powered on "
                          f"and the sender pointed at this laptop's IP:{config.firmware_port}?")
            print(f"[hw] Pi connected from {addr}")
            conn.settimeout(_WAIT)
            recv = protocol.socket_reader(conn)

            counts = {protocol.FRAME: 0, protocol.AUDIO: 0, protocol.EVENT: 0}
            deadline = time.monotonic() + _WAIT
            try:
                while time.monotonic() < deadline and counts[protocol.FRAME] == 0:
                    mtype, payload = protocol.read_message(recv)
                    counts[mtype] = counts.get(mtype, 0) + 1
                    if mtype == protocol.FRAME:
                        self.assertTrue(payload[:2] == b"\xff\xd8",
                                        "FRAME payload is not a JPEG (SOI marker missing)")
                    elif mtype == protocol.EVENT:
                        ev = protocol.decode_event(payload)
                        self.assertIn("kind", ev)
            except EOFError:
                self.fail("Pi closed the connection before sending a frame")
            finally:
                conn.close()
            print(f"[hw] received — frames={counts[protocol.FRAME]} "
                  f"audio={counts[protocol.AUDIO]} events={counts[protocol.EVENT]}")
            self.assertGreater(counts[protocol.FRAME], 0,
                               "Pi connected but sent no valid frames")
        finally:
            srv.close()


if __name__ == "__main__":
    unittest.main()
