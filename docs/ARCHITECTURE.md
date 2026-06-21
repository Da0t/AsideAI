# Architecture

The Narrator is three code components — **firmware**, **backend**, **frontend** —
plus a couple of external services. The firmware perceives, the backend
interprets, the frontend performs. This doc covers the full pipeline, how the
components communicate, the live-loop vs. async split, the design rules, and the
service → job mapping.

> **Where things run:** the Pi (QNX, C++) captures and triggers; a **laptop**
> (Python) runs the orchestrator and calls the cloud. **Claude Haiku 4.5 vision is
> the eyes + brain** (frame → description + line in one call) — Overshoot is gone.
> On-device event triggers use **TensorFlow Lite via QSF** — MediaPipe is gone (it
> doesn't build on QNX). See Deployment Topology.

---

## Deployment Topology

Three code components, three physical tiers, plus the cloud services:

| Tier                       | Runs                          | Contains                                                  |
| -------------------------- | ----------------------------- | -------------------------------------------------------- |
| **Wearable (Raspberry Pi, QNX SDP 8.0)** | C++          | `firmware/` — QSF camera + mic capture, **TFLite** event triggers |
| **Laptop (Linux/macOS)**   | Python                        | `backend/` — the **orchestrator**: Claude vision, Deepgram STT/TTS, Redis, Sentry |
| **Companion app (phone)**  | React Native / Expo           | `frontend/` — control surface + speakers                 |
| **Cloud services**         | —                             | Claude Haiku 4.5 (vision + narration), Deepgram STT + TTS |

The split is **"QNX captures, laptop orchestrates."** The Pi does the hard
real-time, QNX-specific work (capture + on-device ML in C++) and ships
frames/audio/events to the laptop **over the LAN (Wi-Fi)**. The laptop runs the
Python orchestrator and the cloud SDKs — which sidesteps running those SDKs on
QNX. **Redis runs on the laptop** (local) or in the cloud. **Sentry monitors the
laptop orchestrator** (not the device).

> **Why this split:** the QNX Pi has no GPU (so heavy ML is cloud, not local), and
> the Python SDKs (Anthropic, Deepgram, Redis) are painful on QNX. Letting the
> laptop be the orchestrator keeps QNX doing what it's good at — deterministic
> capture + on-device TFLite — and keeps the cloud glue in easy Python.

### Why TFLite, not MediaPipe (on-device triggers)

MediaPipe targets Linux / Android / iOS — **not QNX**; being C++ doesn't make it
portable. **TensorFlow Lite via QSF (QNX Sensor Framework)** is the QNX-supported
on-device ML path, proven by `qnx/projects/ai-camera-app` (QSF camera + TFLite on
QNX SDP 8.0 / Pi 4). TFLite is only the *trigger*, not the eyes — cuttable; fall
back to OpenCV motion detection or manual cues.

---

## The Pipeline (live loop)

```
  ┌──── Raspberry Pi (QNX, C++) ────┐                ┌──── Laptop (Python orchestrator) ────┐
  │  camera ─QSF→ frame ────────────┼──── LAN ──────▶│  1. frame  (→ Claude vision)          │
  │  mic ───────→ audio ────────────┼──── LAN ──────▶│  2. speech ◀── Deepgram STT (mic)     │
  │  TFLite event detection ────────┼──── LAN ──────▶│     event: "narrate now" + cue        │
  │  (entrance / wave / fall)       │                │  3. active personality ◀── Redis      │
  └─────────────────────────────────┘                │            │                          │
                                                      │            ▼                          │
                                                      │  4. prompt_builder                    │
                                                      │     (system prompt + frame[image]     │
                                                      │      + speech + recent history)       │
                                                      │            │                          │
                                                      │            ▼                          │
                                                      │  5. Claude Haiku (vision)             │
                                                      │     image + prompt → SHORT line       │
                                                      │     (EYES + BRAIN in one call)        │
                                                      │            │                          │
                                                      │            ▼                          │
                                                      │  6. Deepgram TTS → voice audio        │
                                                      │  7. write line to Redis (callbacks)   │
                                                      │  Sentry monitors all of this.         │
                                                      └────────────┬──────────────────────────┘
                                                  voice audio + cue │ signals
                                                                   ▼
                                                          ┌────────────────────────────────┐
                                                          │         frontend/  (phone)       │
                                                          │  AudioManager: duck/cut music,   │
                                                          │  play voice (priority, NO        │
                                                          │  stacking), restore              │
                                                          │  manual cues + TFLite-fired cues │
                                                          └────────────────────────────────┘
```

### Step by step

1. **Capture (firmware, Pi).** Camera frames via QSF + mic audio. TFLite runs on
   every frame locally; frames, audio, and events go to the laptop **over the LAN**.
2. **Detect events (TFLite, on-device).** Person enters / waves / falls → signal
   the laptop to **narrate now** and to **auto-fire a cue** (e.g. the entrance
   theme). No cloud round-trip — this is why it feels instant.
3. **See + narrate (Claude Haiku, vision).** The laptop sends the **frame as an
   image** plus the personality prompt to Claude Haiku 4.5, which **describes the
   scene and writes the in-character line in one call** — eyes + brain merged.
   Low `max_tokens`.
4. **Hear (Deepgram STT).** Mic audio → text (optionally with sentiment / intent).
5. **Recall state (Redis).** Active personality + mode + recent history (callbacks).
6. **Build the prompt (`prompt_builder`).** Personality system prompt + frame +
   speech + a little history.
7. **Voice it (Deepgram TTS).** The line becomes audio in the personality's voice.
8. **Perform (frontend).** The app plays the voice, ducking/cutting music. **Voice
   has priority — no stacking.** Manual + TFLite-fired cues play pre-loaded SFX
   instantly.
9. **Remember (Redis).** The line is appended to history for callbacks.

> **Latency budget: ~1–2 seconds end to end.** The Pi→laptop LAN hop is ~10–30ms;
> the cloud calls (Claude + Deepgram) dominate. Keep the frame small and
> `max_tokens` low.

> **Cinematic entrance (the payoff):** TFLite sees a person enter → the entrance
> theme fires **instantly** (on-device trigger → phone) → narration arrives ~1–2s
> later over the now-ducked theme. The lag becomes a dramatic beat.

---

## How the Components Communicate

The `firmware ↔ backend` hop is now a **LAN/TCP** connection (the backend is on a
laptop, not the Pi). The cloud calls and the phone delivery are the other hops.

| From → To              | Transport                          | Payload                                   |
| ---------------------- | ---------------------------------- | ----------------------------------------- |
| firmware → backend     | **LAN / TCP** (Wi-Fi)              | Latest camera frame (JPEG, downscaled)    |
| firmware → backend     | **LAN / TCP** (Wi-Fi)              | Mic audio chunks                          |
| firmware → backend     | **LAN / TCP** (Wi-Fi)              | TFLite event signals ("narrate now", "entrance") |
| backend → Claude       | Anthropic SDK / HTTP               | Personality prompt **+ frame image** → short line |
| backend → Deepgram STT | Deepgram SDK / WS                  | Mic audio → transcript (+ sentiment/intent) |
| backend → Deepgram TTS | Deepgram SDK / HTTP                | Line text → voice audio                   |
| backend ↔ Redis        | Redis protocol (laptop-local/cloud)| Active personality/mode, narration history |
| backend → frontend     | WebSocket (push, over LAN)         | Voice audio **and** cue signals (fire / which) |
| frontend → backend     | WebSocket / HTTP (over LAN)        | Switch personality/mode, manual cue, custom personality |
| backend → Sentry       | Sentry SDK (on the laptop)         | Errors + performance traces               |

### Pi ↔ laptop protocol

A framed **TCP** connection from the Pi to a port the laptop backend listens on
(`FIRMWARE_LISTEN`, e.g. `0.0.0.0:8765`). Three message kinds, length-prefixed:

- `frame` — JPEG bytes (downscaled, to control Claude image-token cost/latency)
- `audio` — a PCM chunk for Deepgram STT
- `event` — `{kind, narrate_now, cue}` from the on-device TFLite detector

It's a moving wearable on Wi-Fi: **design for dropped frames** (skip/reuse — only
one frame per narration cycle is needed) and **reconnect on drop**.

### Claude vision specifics

Claude Haiku 4.5 accepts **image input** (base64 JPEG/PNG, or a URL) alongside text
in a user message. One request carries the frame + the personality system prompt
and returns the in-character line — no separate scene-description service.

---

## Live Loop vs. Async

Two clocks run in this system. Keep them separate.

### Live loop (hot path — must be fast)

```
Pi: frame + audio + TFLite triggers ─LAN→ laptop: Claude Haiku (vision) → Deepgram TTS → phone audio
```

Everything above runs on the **~1–2s** budget. Nothing slow, nothing generated on
demand that could be pre-loaded, nothing optional.

### Async (cold path — off the hot loop)

```
narration history (Redis) → Midjourney → illustrated "journal"
```

The **journal** turns the session's narration into per-personality illustrated
panels via Midjourney. It reads Redis history *after the fact*, renders in the
background, and never blocks narration. Built **last** and fully **cuttable**.

> **The rule:** if it has to happen before the next line is spoken, it's live. If
> it can happen seconds or minutes later, it's async. When in doubt, push it async.

---

## Design Rules

1. **The live loop must stay fast (~1–2s).** Narration stays **SHORT** — low
   `max_tokens` on Claude Haiku.

2. **Music/SFX are pre-loaded and fire instantly from the frontend.** Never
   generate audio cues live. They ship as files in `assets/sounds/`.

3. **Each personality is a bundle:**
   `{name, Claude system prompt, Deepgram voice, sound-cue set}`.
   **Only the active personality's sounds fire** — the hype man's air horn does
   not play while the goth mommy is narrating.

4. **Custom personalities are first-class.** Pick a Deepgram voice + describe a
   character → the same bundle shape.

5. **Everything is free.** No payment, no paid tiers. (Claude + Deepgram are the
   only paid APIs and were already in the plan; QNX, QSF, and TFLite are free.)

6. **The journal (Midjourney) is async, off the live loop, and built last.**

7. **TFLite is the trigger, not the eyes.** Claude vision does the seeing;
   on-device TFLite only decides *when* to narrate and *which* cue to auto-fire.
   On-device, on the Pi, and **cuttable** — fall back to OpenCV motion detection or
   manual cues without touching narration.

See [PERSONALITIES.md](PERSONALITIES.md) for the bundle structure and
[BUILD_ORDER.md](BUILD_ORDER.md) for sequencing and what's cuttable.

---

## Service → Job Mapping

| Service / piece    | Job                          | Where it runs                       |
| ------------------ | ---------------------------- | ----------------------------------- |
| **Claude Haiku**   | Vision **+** narration (eyes + brain) | cloud — called by the laptop |
| **Deepgram**       | STT + TTS (ears + voice)     | cloud — called by the laptop        |
| **TFLite / QSF**   | On-device event triggers     | **the Pi** (QNX, C++) — local, no round-trip |
| **Redis**          | Memory + state               | the laptop (local) or cloud         |
| **Sentry**         | Reliability                  | the laptop (the orchestrator host)  |
| **Midjourney**     | Journal (async)              | off the critical path               |

> **Overshoot has been removed** — Claude vision replaced it and folded the "eyes"
> into the same call as the "brain". **MediaPipe has been removed** — TFLite via
> QSF is the QNX-native on-device trigger path.

---

## Component Responsibilities (one line each)

- **`firmware/`** (Raspberry Pi, QNX, C++) — perceive and trigger: QSF camera + mic
  capture, TFLite event detection, ship frames/audio/events to the laptop over the
  LAN.
- **`backend/`** (laptop, Python — the orchestrator) — interpret and route: receive
  the frame + speech + events, build the prompt, call Claude (vision → line), voice
  it with Deepgram, manage Redis, report to Sentry.
- **`frontend/`** (phone) — perform & control: switch personality/mode, build
  custom personalities, play voice while ducking music, fire manual + auto cues.
