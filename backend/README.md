# backend/ — the central hub

Where perception becomes performance. The backend receives the camera frame from
the Pi over the LAN, sends it to Claude Haiku (vision) to both *see* and *narrate*
in one call, voices the line with Deepgram, and manages Redis (memory + state) and
Sentry (reliability). It runs **on a laptop on the same LAN as the QNX Pi** — which
keeps the cloud SDKs (Anthropic, Deepgram, Redis) off QNX.

## The live loop (must stay ~1–2s)

```
camera frame ─┐
              ├─▶ prompt_builder ─▶ Claude Haiku (vision → SHORT line) ─▶ Deepgram TTS ─▶ frontend
Deepgram STT ─┤        (system prompt                                       (voice          (plays,
active persona┘         + frame[image]                                       audio)          ducks music)
 (Redis)                + speech)                          │
                                          append line to Redis history (callbacks)
```

Claude is **eyes + brain** — the frame goes in as an image and the in-character
line comes out in a single request. Keep it short: low `max_tokens`. See
[../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the full pipeline.

## Modules

| File                        | Job                                                                |
| --------------------------- | ------------------------------------------------------------------ |
| `main.py`                   | Orchestration entry point. Runs the live loop; serves the frontend WS; ingests frames/audio/events from the Pi firmware over a LAN/TCP socket (`FIRMWARE_LISTEN`). |
| `prompt_builder.py`         | Combine personality system prompt + frame (image) + speech (+ history). |
| `config.py`                 | Load env + settings (keys, Redis URL, model, `max_tokens`, loop timing). |
| `clients/claude.py`         | **Eyes + brain** — frame + prompt → short in-character line (Claude Haiku 4.5 vision). |
| `clients/deepgram_stt.py`   | **Ears** — mic audio → transcript.                                 |
| `clients/deepgram_tts.py`   | **Voice** — line text → voice audio (per-personality voice id).    |
| `clients/redis_client.py`   | **Memory + state** — active personality/mode, narration history.   |
| `clients/sentry_client.py`  | **Reliability** — init + capture errors/traces (monitors this laptop orchestrator). |
| `journal/midjourney.py`     | **Async journal** — illustrated panels from history. Off the hot path, built last. |

## Service → job

| Service      | Module                          | Job                          |
| ------------ | ------------------------------- | ---------------------------- |
| Claude Haiku | `clients/claude.py`             | Vision + narration (eyes + brain) |
| Deepgram     | `deepgram_stt` / `deepgram_tts` | STT + TTS (ears + voice)     |
| Redis        | `clients/redis_client.py`       | Memory + state               |
| Sentry       | `clients/sentry_client.py`      | Reliability                  |
| Midjourney   | `journal/midjourney.py`         | Journal (async)              |

> **TFLite** event triggers run in `firmware/` on the Pi (not here, and not
> MediaPipe — which doesn't build on QNX). They tell the backend *when* to narrate
> and *which* cue to auto-fire. **Overshoot is gone** — Claude vision replaced it.

## Claude vision usage

Claude Haiku 4.5 accepts **image input**. The camera frame (base64 JPEG/PNG, or a
URL) goes in a user message alongside the text context; the response is the
in-character line. Keep the frame modestly sized to control image-token cost and
latency.

## Run

The core backend is **stdlib-only** — it runs with no installs and no keys. Run
from the **repo root** (it's a package: `backend`).

```bash
# Offline smoke loop — narrates a frame in all 3 personalities, no Pi/keys/installs
python -m backend.main --mock
python -m backend.main --mock --image room.jpg --play     # narrate a photo, out loud

# Talk to it (laptop mic / Snowball -> STT -> Claude -> voice out loud)
python -m backend.main --talk                              # push-to-talk
python -m backend.main --talk --image room.jpg --personality goth-mommy

# Watch it narrate the laptop WEBCAM live, out loud (Pi-camera stand-in)
pip install opencv-python
python -m backend.main --webcam                            # narrates every ~2s
python -m backend.main --webcam --personality hype-man --interval 4

# Tests (stdlib unittest)
python -m unittest backend.tests.test_protocol backend.tests.test_prompt_builder

# Live with the Pi: bind the Pi TCP socket + phone WS, run the loop
cp .env.example .env          # add ANTHROPIC_API_KEY, DEEPGRAM_API_KEY (optional: REDIS_URL, SENTRY_DSN)
pip install -r backend/requirements.txt   # websockets, certifi, sounddevice (+ optional opencv/redis/sentry)
python -m backend.main --serve --play
```

Full run/deploy flow (laptop + Pi): [../docs/DEPLOY.md](../docs/DEPLOY.md).

**How "mock vs live" works:** each client checks for its key/dep and falls back to
an offline stub if absent — Claude → canned per-personality lines, Deepgram TTS →
silent WAV, Redis → in-memory, Sentry → no-op, frame → placeholder JPEG. Add a key
and that client goes live; nothing else changes. Cloud calls use stdlib `urllib`,
so the `anthropic`/`deepgram` SDKs are **not** required.

> Implemented: `config`, `protocol`, `prompt_builder`, all `clients/*`, `main.py`
> (loop + Pi TCP ingest + phone WS), and the wire contract in
> [../docs/PROTOCOL.md](../docs/PROTOCOL.md). Still stubs: the streaming-STT path
> (prerecorded REST hook exists) and `journal/midjourney.py` (build last).
