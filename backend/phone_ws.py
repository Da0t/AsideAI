"""Phone channel over WebSocket (laptop <-> phone) — the real frontend path.

Requires the `websockets` package (optional; main.py falls back to Noop if absent).
Runs its own asyncio loop in a background thread so the sync narration loop can
broadcast via run_coroutine_threadsafe.

Implemented to docs/PROTOCOL.md §2. NOT exercised in the offline smoke (no phone
here) — verify during frontend integration.
"""

import asyncio
import json
import logging
import threading

import websockets  # raises ImportError -> main.py uses NoopPhone

from .clients import redis_client

log = logging.getLogger("phone")


class WebSocketPhone:
    def __init__(self, hub, port: int) -> None:
        self.hub = hub
        self.port = port
        self.clients = set()
        self.loop = asyncio.new_event_loop()
        threading.Thread(target=self._run, daemon=True).start()

    def _run(self) -> None:
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self._serve())
        self.loop.run_forever()

    async def _serve(self) -> None:
        await websockets.serve(self._handler, "0.0.0.0", self.port)
        log.info("phone WS listening on 0.0.0.0:%s", self.port)

    async def _handler(self, ws, *_args) -> None:
        self.clients.add(ws)
        await ws.send(json.dumps({
            "type": "state",
            "personality": redis_client.get_active_personality(),
            "mode": redis_client.get_mode(),
        }))
        try:
            async for raw in ws:
                if isinstance(raw, (bytes, bytearray)):
                    continue
                self._on_message(json.loads(raw))
        except Exception:  # noqa: BLE001 — never let one client kill the server
            pass
        finally:
            self.clients.discard(ws)

    def _on_message(self, msg: dict) -> None:
        t = msg.get("type")
        if t == "set_personality":
            redis_client.set_active_personality(msg.get("slug", ""))
            self.broadcast({"type": "state", "personality": msg.get("slug"),
                            "mode": redis_client.get_mode()})
        elif t == "set_mode":
            redis_client.set_mode(msg.get("mode", ""))
            self.broadcast({"type": "state",
                            "personality": redis_client.get_active_personality(),
                            "mode": msg.get("mode")})
        elif t == "manual_cue":
            self.broadcast({"type": "cue", "name": msg.get("name", "")})
        elif t == "create_personality":
            bundle = msg.get("bundle") or {}
            if bundle.get("slug"):
                self.hub.bundles[bundle["slug"]] = bundle

    # --- broadcast (called from the sync narration loop) ---

    def broadcast(self, msg: dict) -> None:
        self._send_all(json.dumps(msg))

    def broadcast_voice(self, audio: bytes, meta: dict) -> None:
        self._send_all(json.dumps({"type": "voice", **meta}))  # header
        self._send_all(audio)                                   # binary audio frame

    def _send_all(self, data) -> None:
        if not self.clients:
            return

        async def _do():
            dead = []
            for ws in list(self.clients):
                try:
                    await ws.send(data)
                except Exception:  # noqa: BLE001
                    dead.append(ws)
            for ws in dead:
                self.clients.discard(ws)

        asyncio.run_coroutine_threadsafe(_do(), self.loop)
