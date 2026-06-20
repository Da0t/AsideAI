# Architecture

The Narrator is three code components — **firmware**, **backend**, **frontend** —
plus six external services. The firmware perceives, the backend interprets, the
frontend performs. This doc covers the full pipeline, how the components
communicate, the live-loop vs. async split, the design rules, and the
service → job mapping.

---

## Deployment Topology

Three code components, but only **two physical tiers** plus the cloud services:

| Tier                     | Runs                                   | Contains                                              |
| ------------------------ | -------------------------------------- | ---------------------------------------------------- |
| **Wearable (Raspberry Pi)** | the "body"                          | `firmware/` (camera + mic capture, LiveKit publish) **and** `backend/` (the on-device **orchestrator**) + Sentry |
| **Cloud services**       | the "brain & senses" (sponsors)        | Overshoot, Deepgram STT, Deepgram TTS, Claude Haiku, Redis |
| **Companion app (phone)**| control surface + speakers             | `frontend/`                                          |

The important nuance: **`backend/` is the on-device orchestrator — it runs on the
Pi, co-located with `firmware/`.** It is *not* a separate cloud server. The
orchestrator routes sensor data out to the cloud services, collects the
responses, decides what fires, and reads personality state from Redis. So:

- The `firmware/` → `backend/` audio hop is **local/in-process on the Pi**, not a
  network call to a remote server.
- **Sentry runs device-side**, monitoring the pipeline where it executes.
- The only thing that crosses the network on the hot path is calls to the cloud
  AI services and the voice/cue delivery to the phone.

The split between `firmware/` and `backend/` is therefore a **code-organization**
boundary (capture vs. orchestration), not a deployment boundary — both ship to the
Pi together.

---

## The Pipeline (live loop)

```
  ┌───────────── Raspberry Pi (the body) ──────────────┐
  │ ┌─────────────┐                                    │
  │ │  firmware/  │                                    │
  │ │  camera ────┼──────────────▶ Overshoot (publish video via LiveKit)
  │ │  mic ───────┼──────┐          (vision, <200ms)   │      │
  │ └─────────────┘      │ (local)      │              │      │
  │                      ▼              │ scene        │      │
  │             ┌────────────────────────────────────┐ │      │
  │             │   backend/  (on-device orchestrator)│ │      │
  │             │                                    │ │      │
  │             │  1. scene   ◀── Overshoot          │◀┼──────┘
  │             │  2. speech  ◀── Deepgram STT (mic) │ │  (+ sentiment/intent)
  │             │  3. active personality ◀── Redis   │ │
  │             │            │                       │ │
  │             │            ▼                       │ │
  │             │  4. prompt_builder                 │ │
  │             │     (system prompt + scene +       │ │
  │             │      speech + recent history)      │ │
  │             │            │                       │ │
  │             │            ▼                       │ │
  │             │  5. Claude Haiku → SHORT line      │ │
  │             │     (+ decides voice / music cue)  │ │
  │             │            │                       │ │
  │             │            ▼                       │ │
  │             │  6. Deepgram TTS → voice audio     │ │
  │             │            │                       │ │
  │             │  7. write line to Redis (callbacks)│ │
  │             └────────────┬───────────────────────┘ │
  │  Sentry monitors the pipeline, device-side. ───────┘
  └───────────────┬─────────────────────────┬──────────┘
                  │ voice audio              │ music-cue decision (fire / which)
                  ▼                          ▼
          ┌────────────────────────────────────────┐
          │              frontend/  (phone)          │
          │  AudioManager: duck/cut music, play      │
          │  voice (priority, NO stacking), restore  │
          │  manual cues: entrance theme, laugh track│
          └────────────────────────────────────────┘
```

### Step by step

1. **Capture (firmware).** Camera frames + mic audio. Camera video is published
   to an Overshoot stream over LiveKit; mic audio is handed to the on-device
   orchestrator (a **local** hop — `backend/` runs on the same Pi).
2. **See (Overshoot).** The orchestrator asks Overshoot for a scene description of
   the latest frame (or last few seconds) of the live video — targets **<200ms**.
3. **Hear (Deepgram STT).** Mic audio is transcribed to text — what people in the
   room are saying — optionally enriched with **sentiment / intent** from
   Deepgram's audio intelligence.
4. **Recall state (Redis).** The orchestrator reads the active personality and
   mode, plus recent narration history (for callbacks).
5. **Build the prompt (`prompt_builder`).** Combine the personality's system
   prompt + the scene description + recent speech + a little history.
6. **Narrate (Claude Haiku).** One short, in-character line — low `max_tokens`.
   The brain **also decides the voice and whether to fire a music cue** (e.g. an
   entrance theme), which is signaled to the app alongside the line.
7. **Voice it (Deepgram TTS).** The line becomes audio in the personality's voice.
8. **Perform (frontend).** The app plays the voice, ducking/cutting any background
   music so narration is always intelligible. **Voice has priority — no stacking.**
   Cue buttons can fire pre-loaded SFX on demand.
9. **Remember (Redis).** The line is appended to narration history so future
   lines can call back to earlier ones.

> **Latency budget: ~1–2 seconds end to end.** Every step in the live loop is on
> the critical path. Keep payloads small and `max_tokens` low (see Design Rules).

> **Cinematic entrance (the payoff):** a door is seen → the entrance theme fires
> **instantly** from the app (pre-loaded) → narration arrives ~1–2s later, spoken
> over the now-ducked theme. The lag becomes a dramatic beat instead of a flaw —
> and it's free, because the music was never on the critical path.

---

## How the Components Communicate

`backend/` here is the **on-device orchestrator** running on the Pi (see
Deployment Topology). The `firmware ↔ backend` hop is local; everything else on
the hot path is a cloud call or delivery to the phone.

| From → To              | Transport                          | Payload                                   |
| ---------------------- | ---------------------------------- | ----------------------------------------- |
| firmware → Overshoot   | **LiveKit** (publish to room)      | Camera video frames                       |
| firmware → backend     | **local** (on-Pi, in-process / loopback) | Mic audio chunks                    |
| firmware ↔ Overshoot   | keepalive ping                     | Keeps the stream from dying (~5 min TTL)  |
| backend → Overshoot    | **HTTP** (OpenAI-compatible chat)  | "Describe this scene" + `ovs://` video ref |
| backend → Deepgram STT | Deepgram SDK / WS                  | Mic audio → transcript (+ sentiment/intent) |
| backend → Claude       | Anthropic SDK / HTTP               | Personality prompt → short line + cue decision |
| backend → Deepgram TTS | Deepgram SDK / HTTP                | Line text → voice audio                   |
| backend ↔ Redis        | Redis protocol                     | Active personality/mode, narration history |
| backend → frontend     | WebSocket (push)                   | Voice audio **and** the music-cue decision (fire / which) |
| frontend → backend     | WebSocket / HTTP                   | Switch personality/mode, manual cue, custom personality |
| backend → Sentry       | Sentry SDK (device-side)           | Errors + performance traces               |

### Overshoot specifics

Overshoot is an **OpenAI-compatible chat completions** API. You reference the
live video inside a chat message using an `ovs://` URI:

- `ovs://streams/{stream_id}?frame_index=-1` — the **latest** frame.
- `ovs://streams/{stream_id}?start_offset_ms=-5000` — the **last 5 seconds**.

**Getting video in:**

1. Create a stream → Overshoot returns a **LiveKit room URL + token**.
2. The firmware publishes camera video to that room via the **LiveKit SDK**.
3. The stream stays alive only ~5 minutes after the last **keepalive** — the
   firmware must ping to keep it open.

---

## Live Loop vs. Async

Two clocks run in this system. Keep them separate.

### Live loop (hot path — must be fast)

```
camera/mic → Overshoot/STT → Claude Haiku → Deepgram TTS → frontend audio
```

Everything above runs on the **~1–2s** budget. Nothing slow, nothing generated
on demand that could be pre-loaded, nothing optional.

### Async (cold path — off the hot loop)

```
narration history (Redis) → Midjourney → illustrated "journal"
```

The **journal** turns the day's narration into illustrated panels via Midjourney —
snapshots captured during the session become **per-personality styled
illustrations** (the goth mommy's journal looks nothing like the hype man's). It
reads from Redis history *after the fact*, renders in the background, and never
blocks narration. It is built **last** and is fully **cuttable** — the bonus
encore and shareable artifact, not a dependency.

> **The rule:** if it has to happen before the next line is spoken, it's live. If
> it can happen seconds or minutes later, it's async. When in doubt, push it async.

---

## Design Rules

These are non-negotiable constraints that shape every component.

1. **The live loop must stay fast (~1–2s).** Narration stays **SHORT** — set a
   low `max_tokens` on Claude Haiku. A great one-liner beats a slow paragraph.

2. **Music/SFX are pre-loaded and fire instantly from the frontend.** Never
   generate audio cues live. They ship as files in `assets/sounds/` and play with
   zero latency.

3. **Each personality is a bundle:**
   `{name, Claude system prompt, Deepgram voice, sound-cue set}`.
   **Only the active personality's sounds fire** — the hype man's air horn does
   not play while the goth mommy is narrating.

4. **Custom personalities are first-class.** A user can create one by picking a
   Deepgram voice and describing a character. It produces the same bundle shape.

5. **Everything is free.** No payment, no paid tiers, no gated features.

6. **The journal (Midjourney) is async, off the live loop, and built last.**

See [PERSONALITIES.md](PERSONALITIES.md) for the bundle structure and
[BUILD_ORDER.md](BUILD_ORDER.md) for sequencing and what's cuttable.

---

## Service → Job Mapping

| Service          | Job                | Driven by                          |
| ---------------- | ------------------ | ---------------------------------- |
| **Overshoot**    | Vision / eyes      | on-Pi orchestrator ← firmware video |
| **Deepgram**     | STT + TTS (ears + voice) | on-Pi orchestrator           |
| **Claude Haiku** | Narration / brain  | on-Pi orchestrator                 |
| **Redis**        | Memory + state     | orchestrator (read) + app (write state) |
| **Sentry**       | Reliability        | device-side (on the Pi)            |
| **Midjourney**   | Journal (async)    | app, off the critical path         |

> The AI services and Redis are the **cloud tier**; the orchestrator (`backend/`)
> on the Pi drives them. Sentry watches the pipeline where it runs, on the device.

---

## Component Responsibilities (one line each)

- **`firmware/`** (on the Pi) — perceive and publish: camera → Overshoot
  (LiveKit), mic → orchestrator (local), keep the stream alive.
- **`backend/`** (on the Pi — the orchestrator) — interpret and route: gather
  scene + speech + state, build the prompt, call Claude (line + cue decision),
  voice it with Deepgram, manage Redis, report to Sentry device-side.
- **`frontend/`** (phone) — perform & control: switch personality/mode, build
  custom personalities, play voice while ducking music, fire manual cues.
