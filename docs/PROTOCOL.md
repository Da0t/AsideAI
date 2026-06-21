# Wire Protocol

The two interface contracts that let the firmware, backend, and frontend tracks be
built in parallel. Implement to these and the pieces snap together.

- **Pi → laptop** — frames/audio/events over **TCP** (the live perception feed).
- **laptop ↔ phone** — control + audio over **WebSocket**.

---

## 1. Pi → laptop (TCP)

The Pi firmware (`firmware/src/net_client.cpp`, C++) connects to the laptop
backend, which binds `FIRMWARE_LISTEN` (default `0.0.0.0:8765`). One TCP
connection; reconnect on drop.

Reference implementation (decode side): [`backend/protocol.py`](../backend/protocol.py).

### Framing

Every message is length-prefixed and typed:

```
┌────────────┬──────────────────────────┬─────────────────────┐
│ type: u8   │ length: u32 (big-endian) │ payload: length bytes│
└────────────┴──────────────────────────┴─────────────────────┘
```

| type | name  | payload                                            |
| ---- | ----- | -------------------------------------------------- |
| `1`  | FRAME | JPEG bytes (downscaled to ~`FRAME_MAX_DIM` on the long edge) |
| `2`  | AUDIO | raw PCM, `s16le`, mono (chunked)                   |
| `3`  | EVENT | UTF-8 JSON — see below                             |

`length` is capped at 16 MB. The backend keeps only the **latest** frame (it
narrates on a cadence or on an event, not per frame), buffers audio for STT, and
acts on each event.

### EVENT payload

```json
{ "kind": "entrance", "narrate_now": true, "cue": "entrance" }
```

| field         | type    | meaning                                              |
| ------------- | ------- | ---------------------------------------------------- |
| `kind`        | string  | what the on-device TFLite detector saw: `entrance` \| `wave` \| `fall` \| … |
| `narrate_now` | bool    | ask the backend to narrate this moment immediately   |
| `cue`         | string  | pre-loaded cue to auto-fire on the phone (`""` = none); a key in `assets/sounds/manifest.json` |

### Notes

- It's a moving wearable on Wi-Fi — **expect dropped frames** (fine: one frame per
  cycle is enough) and reconnect cleanly.
- C++ side: write `type` then `htonl(length)` then the payload; mirror EVENT JSON
  exactly.

---

## 2. laptop ↔ phone (WebSocket)

The phone (`frontend/src/api/backend.ts`) connects to the backend's WebSocket over
the LAN. JSON text messages, except voice audio which is sent as a binary frame
(or a base64 field — pick one at build time; this spec uses a binary frame
preceded by a small JSON header).

All messages are **JSON text** (no binary frames — keeps the React Native client
simple). Voice audio rides as base64 inside the `voice` message.

### laptop → phone

| `type`    | fields                                    | meaning                                        |
| --------- | ----------------------------------------- | ---------------------------------------------- |
| `state`   | `{ personality, mode, running }`          | current active personality/mode + whether narration is running (on connect + on every change) |
| `line`    | `{ text, personality }`                   | the narration text just spoken (live captions) |
| `voice`   | `{ audio (base64), mime, personality }`   | the narration audio to play (voice has priority — duck music) |
| `cue`     | `{ name }`                                | fire a pre-loaded cue now (entrance/laugh/…); from an event or another client |

### phone → laptop

| `type`              | fields                  | meaning                                  |
| ------------------- | ----------------------- | ---------------------------------------- |
| `set_personality`   | `{ slug }`              | switch active personality (backend writes Redis) |
| `set_mode`          | `{ mode }`              | switch mode                              |
| `set_running`       | `{ running }`           | pause/resume narration (the phone's Go Live / play-pause) |
| `manual_cue`        | `{ name }`              | user tapped a cue button → fire SFX (echoed to all clients) |
| `create_personality`| `{ bundle }`            | save a custom personality (same bundle shape as `personalities/*.json`) |

### Notes

- `personality` / `slug` values match the `slug` field in `personalities/*.json`
  (e.g. `hype-man`, `goth-mommy`, `epic-quest-narrator`).
- `cue` / `name` values match the cue keys in `assets/sounds/manifest.json`
  (`entrance`, `laugh_track`, `sting`, `theme_loop`).
- **Voice has priority, no stacking** — when a `voice` message arrives, the
  AudioManager ducks/cuts music, plays the voice, then restores. See
  `frontend/src/audio/AudioManager.ts`.
