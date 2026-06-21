# The Narrator

> A Raspberry Pi wearable that watches a room in real time and narrates what's
> happening out loud — in a personality you can swap on the fly.

A hype man. A goth mommy who emotionally supports you. An epic quest narrator who
turns your day into a saga. Same moment, wildly different narration. Walk into a
room and your wearable announces you over entrance music; trip over a chair and
the laugh track fires. A mobile app switches personalities and modes, builds
custom ones, and plays the audio — ducking music under the voice so the narration
always wins.

---

## The Pitch

Wearables today either record you or coach you. **The Narrator does neither — it
performs your life back to you in real time.** A camera + mic clipped to your
chest perceives the room, and a swappable AI personality narrates the scene out
loud with its own voice, music, and sound effects.

The magic is *interpretation*, not transcription. The same moment —
someone walking in with coffee — becomes:

- **Hype man:** "AYO they're BACK and they brought the FUEL, let's GOOO!"
- **Goth mommy:** "Look at you, my little raven — returning with your potion of
  warmth. You're doing so beautifully today."
- **Epic quest narrator:** "Lo! The hero returns from the Bean Mines, sacred
  elixir in hand. The morning campaign may at last begin."

  Added User Pearsons
  Comp anaylsis
  Simple Problem Statment with solution
  AI integratiton slide deck with images or not a lot of words
  

## Three-Component Architecture

```
┌────────────────────────────┐   frame ─┐  audio ─┐  TFLite events ─┐
│ firmware/  Raspberry Pi     │          │         │  (entrance/wave/ │
│ (QNX, C++)                  │          │         │   fall → cue)    │
│ QSF camera + mic + TFLite   │          ▼         ▼                 ▼
└────────────────────────────┘   ════════ LAN (Wi-Fi) ════════════════
                          ┌─────────────────────────────────────────┐
                          │        backend/  (laptop, Python)        │
                          │  frame → Claude Haiku (vision = eyes +   │
                          │      brain, one call → SHORT line)       │
                          │  + Deepgram STT + active personality     │
                          │      (Redis) → Deepgram TTS (voice)      │
                          │   Redis = memory + state                 │
                          │   Sentry = reliability                   │
                          └────────────────┬────────────────────────┘
                                  voice audio │ + cue signals
                                           ▼
                                  ┌──────────────────┐
                                  │    frontend/     │
                                  │  React Native /  │
                                  │      Expo        │
                                  │ switch + play +  │
                                  │  duck music/SFX  │
                                  └──────────────────┘
```

**Deployment:** the Pi (QNX, C++) captures + runs on-device triggers; a **laptop**
(Python) runs the orchestrator and calls the cloud. They talk over the LAN.

- **`firmware/`** (Raspberry Pi, **QNX, C++**) — captures camera frames via **QSF**
  + mic audio, runs **TensorFlow Lite** on-device for fast event detection
  (entrance, wave, fall), and ships frames / audio / event signals to the laptop
  backend **over the LAN**.
- **`backend/`** (Python, on a **laptop** on the same LAN) — the orchestrator.
  Sends the camera **frame directly to Claude Haiku 4.5 (vision)** — one call
  returns the in-character line, so Claude is both eyes and brain. Pulls speech
  from Deepgram STT and the active personality from Redis, builds the prompt, and
  sends the line to Deepgram TTS for voice audio. Holds memory + state in Redis,
  monitored by Sentry. (Running the orchestrator on the laptop keeps the cloud
  SDKs off QNX.)
- **`frontend/`** (React Native / Expo) — personality + mode switcher, custom
  personality builder, audio output with a manager that ducks/cuts music under
  narration (voice has priority), and manual cue buttons (entrance theme, laugh
  track).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full pipeline.

## Service → Job

| Service / piece  | Job in the system                       |
| ---------------- | --------------------------------------- |
| **Claude Haiku** | Vision **+** narration — eyes + brain (frame + prompt → short in-character line, one call) |
| **Deepgram**     | STT + TTS (ears + voice)                |
| **TFLite / QSF** | On-device event triggers (entrance/wave/fall → instant cues) — runs on the Pi (QNX) |
| **Redis**        | Memory + state (callbacks, active personality/mode) — on the laptop |
| **Sentry**       | Reliability (monitors the laptop orchestrator) |
| **Midjourney**   | Async illustrated "journal" (off the live path) |

> **Overshoot** was the original "eyes" but is no longer used — Claude vision
> replaced it and folded scene understanding into the same call as the narration.
> **MediaPipe** was the planned on-device trigger but doesn't build on QNX —
> **TensorFlow Lite via QSF** replaced it (proven by QNX's `ai-camera-app`).

## Build Order (short version)

Build the live loop first, make it fast, then layer personality and polish on top.

1. **Firmware camera → laptop → Claude vision** — Pi sends a frame over the LAN;
   laptop sends it to Claude Haiku → a text scene. Prove we can see.
2. **Full core loop** — frame → laptop → Claude (line) → Deepgram → audio. Measure
   latency.
3. **Personality system** — the swappable bundles.
4. **Music/SFX + frontend** — cue buttons, ducking audio manager.
5. **Redis memory** — narration history (callbacks) + shared state.
6. **TFLite triggers** — on-device event detection on the Pi → auto-fire cues
   (cuttable; fork QNX's `ai-camera-app`).
7. **Journal (Midjourney)** — async, last, cuttable.

Full sequencing and what's cuttable: [docs/BUILD_ORDER.md](docs/BUILD_ORDER.md).

## Getting Started

```bash
cp .env.example .env   # fill in your keys
```

Then follow the README in each component:

- [firmware/README.md](firmware/README.md)
- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

## Design Rules

These are load-bearing. Full detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

1. **The live loop stays fast (~1–2s).** Narration stays SHORT — low
   `max_tokens` on Claude.
2. **Music/SFX are pre-loaded** and fire instantly from the frontend. Never
   generated live.
3. **Each personality is a bundle:** `{name, Claude system prompt, Deepgram
   voice, sound-cue set}`. Only the active personality's sounds fire.
4. **Custom personalities are first-class** — pick a voice, describe a character.
5. **Everything is free.** No payment, no paid tiers.
6. **The journal is async**, off the live loop, and built last.

> Hackathon scaffold — this repo is documentation and structure only. Every
> module is a TODO stub. See [docs/BUILD_ORDER.md](docs/BUILD_ORDER.md) to start.
