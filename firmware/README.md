# firmware/ — Raspberry Pi capture

The wearable's eyes and ears. Runs on the Raspberry Pi. **Perceive and publish —
nothing more.** No interpretation happens here; that's the backend's job.

## Responsibility

1. **Capture camera video** and **publish it to Overshoot via LiveKit**.
2. **Capture mic audio** and **send it to the backend** (for Deepgram STT).
3. **Keep the Overshoot stream alive** — it dies ~5 minutes after the last
   keepalive ping.

```
camera ──▶ overshoot_stream.py ──(LiveKit)──▶ Overshoot stream
mic    ──▶ mic_capture.py ──────(WS/HTTP)──▶ backend
                 keepalive.py ──(ping)──────▶ Overshoot (keep stream open)
```

## Modules

| File                   | Job                                                            |
| ---------------------- | ------------------------------------------------------------- |
| `main.py`              | Entry point. Wires capture → stream + keepalive, runs loop.   |
| `camera_capture.py`    | Grab frames from the Pi camera.                               |
| `mic_capture.py`       | Grab audio chunks from the mic, ship to backend.              |
| `overshoot_stream.py`  | Create the Overshoot stream, publish video over LiveKit.      |
| `keepalive.py`         | Periodic ping so the stream doesn't expire (~5 min TTL).      |
| `config.py`            | Reads env (`OVERSHOOT_API_KEY`, backend URL, device settings).|

## Overshoot stream lifecycle

1. Create a stream → Overshoot returns a **LiveKit room URL + token**.
2. Publish camera video to that room using the **LiveKit SDK**.
3. Ping keepalive on an interval. **Stream dies ~5 min after the last keepalive.**

The backend later references this stream by id via
`ovs://streams/{stream_id}?frame_index=-1`.

## Setup

```bash
cd firmware
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # set OVERSHOOT_API_KEY, backend URL
python main.py
```

> **Scaffold only.** Every module here is a TODO stub. See
> [../docs/BUILD_ORDER.md](../docs/BUILD_ORDER.md) step 1 to start: camera →
> Overshoot scene descriptions.
